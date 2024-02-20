import courses from '../data.json' assert { type: 'json' };

const form = document.querySelector('#bundleForm');
const totalPriceRef = document.querySelector('#totalPrice');
const totalPriceContainer = {
  originalPrice: document.querySelector('#originalPrice'),
  currentPrice: document.querySelector('#currentPrice'),
  savings: document.querySelector('#savings'),
};

let chosen = [];

const discounts = {
  primary: 0.4,
  secondary: 0.5,
  tertiary: 0.3,
};

form.addEventListener('change', onFormChange);

function onFormChange(e) {
  const course = courses.find(({ name }) => name === e.target.value);

  if (!e.target.checked) {
    chosen = chosen.filter((item) => item.name !== e.target.value);
  } else {
    chosen = findRemovedCourse(chosen);
    console.log(chosen);
    chosen.push({ ...course });
  }

  if (chosen.length === 2) {
    const { courseName, secondCourseDiscount } =
      getPrioritizedCourseNameAndDiscountForSecondCourse(chosen);

    const config = chosen.reduce(
      (acc, item) => {
        /*
          normal discount for prioritized course or
          for course that doesn't have any special discounts
         */
        const itemDiscount =
          item.name === courseName || courseName === ''
            ? item.normalDiscount
            : secondCourseDiscount;

        const itemTotalPrice =
          item.originalPrice - item.originalPrice * itemDiscount;

        return {
          ...acc,
          originalTotalPrice: acc.originalTotalPrice + item.originalPrice,
          totalPrice: acc.totalPrice + itemTotalPrice,
        };
      },
      { originalTotalPrice: 0, totalPrice: 0 }
    );
    updateUI(config);
    return;
  }

  if (chosen.length > 2) {
    const itemDiscount = discounts.primary;
    const config = chosen.reduce(
      (acc, item) => {
        const itemTotalPrice =
          item.originalPrice -
          item.originalPrice *
            (item.name === 'ArchitectureStandart' // if course is ArchitectureStandart, it gets normal discount
              ? item.normalDiscount
              : itemDiscount);
        return {
          ...acc,
          originalTotalPrice: acc.originalTotalPrice + item.originalPrice,
          totalPrice: acc.totalPrice + itemTotalPrice,
        };
      },
      {
        originalTotalPrice: 0,
        totalPrice: 0,
      }
    );
    updateUI(config);
    return;
  }

  updateUI({
    originalTotalPrice: chosen[0]?.originalPrice,
    totalPrice:
      chosen[0]?.originalPrice -
      chosen[0]?.originalPrice * chosen[0]?.normalDiscount,
  });
}

function includesTeamLead(chosen) {
  return chosen.some((item) => item.name === 'TeamLead');
}

function findFlagShip(chosen) {
  return chosen.find((item) => item.isFlagship);
}

function findUnitTest(chosen) {
  return chosen.find((item) => item.name === 'UnitTesting');
}

function findAddressables(chosen) {
  return chosen.find((item) => item.name === 'Addressables');
}

// if radio button is unselected, removes it from chosen array
function findRemovedCourse(chosen) {
  const allRadioButtons = document.querySelectorAll('input[type="radio"]');

  const notCheckedCourses = [...allRadioButtons]
    .filter((item) => !item.checked)
    .map((item) => item.value);

  return chosen.filter((item) => !notCheckedCourses.includes(item.name));
}

// Returns prioritized course name and discount for second course
function getPrioritizedCourseNameAndDiscountForSecondCourse(chosen) {
  const { primary, secondary, tertiary } = discounts;
  const prioritizedCourse =
    findFlagShip(chosen) || findUnitTest(chosen) || findAddressables(chosen);

  if (
    prioritizedCourse?.isFlagship ||
    prioritizedCourse?.name === 'UnitTesting'
  ) {
    return {
      courseName: prioritizedCourse.name,
      secondCourseDiscount: primary,
    };
  }

  if (prioritizedCourse?.name === 'Addressables' && includesTeamLead(chosen)) {
    return {
      courseName: 'TeamLead',
      secondCourseDiscount: tertiary,
    };
  }

  if (prioritizedCourse?.name === 'Addressables') {
    return {
      courseName: prioritizedCourse.name,
      secondCourseDiscount: secondary,
    };
  }
  return { courseName: '' };
}

function updateUI({ originalTotalPrice, totalPrice }) {
  // console.log(originalTotalPrice, totalPrice);
  if (!originalTotalPrice && isNaN(totalPrice)) {
    totalPriceRef.classList.add('hidden');
    return;
  }
  totalPriceRef.classList.remove('hidden');

  totalPriceContainer.originalPrice.innerHTML = originalTotalPrice?.toFixed(2);
  totalPriceContainer.currentPrice.innerHTML = totalPrice?.toFixed(2);
  totalPriceContainer.savings.innerHTML = (
    originalTotalPrice - totalPrice
  )?.toFixed(2);
}

import courses from '../data.json' assert { type: 'json' };

const IS_BLACK_FRIDAY = false;

let PROMO = {
  code: 'abc',
  discount: 0.5,
  inUse: false,
  isUsed: false,
};

const modal = document.querySelector('.modal');
const form = modal.querySelector('.modal-form');

const promoInput = form.elements.promo;

const totalPriceRef = modal.querySelector('.total-price');
const totalPriceContainer = {
  cta: modal.querySelector('.cta'),
  originalPrice: modal.querySelector('#original-price'),
  currentPrice: modal.querySelector('#current-price'),
  savings: modal.querySelector('#savings'),
};

const chosenListRef = modal.querySelector('.chosen-list');

let chosen = [];
let totalPrice = {
  originalTotalPrice: 0,
  currentTotalPrice: 0,
  currentPriceWithPromo: 0,
};

(() => {
  try {
    const data = JSON.parse(localStorage.getItem('formData')) || {};
    if (data.isBlackFriday !== IS_BLACK_FRIDAY)
      localStorage.removeItem('formData');
    else {
      chosen = data.chosen;
      updateChosenList(chosen);
      form.querySelectorAll('input').forEach((item) => {
        const courseNames = data.chosen.map((item) => item.name);

        if (courseNames.includes(item.value)) item.checked = true;

        totalPrice = {
          originalTotalPrice: data.originalTotalPrice,
          currentTotalPrice: data.currentTotalPrice,
        };

        PROMO.inUse = data.promoInUse;
        PROMO.isUsed = data.promoCodeIsUsed;
        promoInput.value = data.promoCode;

        const event = new Event('input');
        promoInput.dispatchEvent(event);

        updateUI(totalPrice);
      });
    }
  } catch (error) {
    throw new Error(error);
  }
})();

const discounts = {
  primary: 0.4,
  secondary: 0.5,
  tertiary: 0.3,
};

const blackFridayDiscounts = {
  primary: 0.5,
  secondary: 0.4,
  tertiary: 0.3,
  quaternary: 0.63,
  pentagonal: 0.7,
};

form.addEventListener(
  'change',
  IS_BLACK_FRIDAY ? onFormChangeIsBlackFriday : onFormChangeIsNotBlackFriday
);

modal.addEventListener('click', onFormClick);

promoInput.addEventListener('input', (e) => {
  if (promoInput.value !== PROMO.code && PROMO.inUse) {
    totalPrice = {
      ...totalPrice,
      currentTotalPrice: totalPrice.currentTotalPrice / PROMO.discount,
    };
    PROMO.inUse = PROMO.isUsed = false;

    updateUI(totalPrice, false);
    return;
  }
  if (promoInput.value !== PROMO.code || PROMO.inUse) return;

  PROMO.inUse = true;

  totalPrice = {
    ...totalPrice,
    currentTotalPrice: totalPrice.currentTotalPrice * PROMO.discount,
  };

  PROMO.isUsed = true;
  updateUI(totalPrice, false);
});

function onFormClick(e) {
  const closest = e.target.closest('button[type="submit"]');
  if (closest) onSubmitForm(e);
  else onClearBtnClick(e);
}

function onClearBtnClick(e) {
  const closest = e.target.closest('.btn-clear');

  if (!closest) return;

  const fieldToClear = form.elements[closest.dataset.name];

  chosen = chosen.filter((item) => item.name !== fieldToClear?.value);

  if (fieldToClear.length)
    findCheckedButtons(...fieldToClear).forEach((item) => {
      item.checked = false;
    });

  fieldToClear.checked = false;

  // Dispatch change event on form
  const event = new Event('change');
  form.dispatchEvent(event);
}

function onFormChangeIsNotBlackFriday(e) {
  if (e.target.name === 'promo') return;

  const course = courses.find(({ name }) => name === e.target.value);

  if (!e.target.checked)
    chosen = chosen.filter((item) => item.name !== e.target.value);
  else {
    chosen = findRemovedCourse(chosen);
    chosen.push({ ...course });
  }

  updateChosenList(chosen);

  if (chosen.length === 2) {
    const { courseName, secondCourseDiscount } =
      getCourseNameAndDiscount(chosen);

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
          currentTotalPrice: acc.currentTotalPrice + itemTotalPrice,
          // - (acc.currentTotalPrice + itemTotalPrice) *
          //   (PROMO.inUse ? PROMO.discount : 0),
        };
      },
      { originalTotalPrice: 0, currentTotalPrice: 0 }
    );
    totalPrice = config;
    updateUI(totalPrice, true);
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
          currentTotalPrice: acc.currentTotalPrice + itemTotalPrice,
          // - (acc.currentTotalPrice + itemTotalPrice) *
          //   (PROMO.inUse ? PROMO.discount : 0),
        };
      },
      {
        originalTotalPrice: 0,
        currentTotalPrice: 0,
      }
    );
    totalPrice = config;
    updateUI(totalPrice, true);
    return;
  }
  totalPrice = {
    originalTotalPrice: chosen[0]?.originalPrice,
    currentTotalPrice:
      chosen[0]?.originalPrice -
      chosen[0]?.originalPrice * chosen[0]?.normalDiscount,
  };

  updateUI(totalPrice, true);
}

function onFormChangeIsBlackFriday(e) {
  if (e.target.name === 'promo') return;

  const course = courses.find(({ name }) => name === e.target.value);

  if (!e.target.checked)
    chosen = chosen.filter((item) => item.name !== e.target.value);
  else {
    chosen = findRemovedCourse(chosen);
    chosen.push({ ...course });
  }

  updateChosenList(chosen);
  if (chosen.length === 2) {
    const { courseName, firstCourseDiscount, secondCourseDiscount } =
      getCourseNameAndBlackFridayDiscount(chosen);

    const config = chosen.reduce(
      (acc, item) => {
        /*
          Black friday  discount for prioritized course or
          for course that doesn't have any special discounts
         */
        const itemDiscount =
          item.name === courseName || courseName === ''
            ? firstCourseDiscount
            : secondCourseDiscount;

        const itemTotalPrice =
          item.originalPrice - item.originalPrice * itemDiscount;

        return {
          ...acc,
          originalTotalPrice: acc.originalTotalPrice + item.originalPrice,
          currentTotalPrice: acc.currentTotalPrice + itemTotalPrice,
          // - (acc.currentTotalPrice + itemTotalPrice) *
          //   (PROMO.inUse && !PROMO.used ? PROMO.discount : 0),
        };
      },
      { originalTotalPrice: 0, currentTotalPrice: 0 }
    );
    totalPrice = config;
    updateUI(totalPrice);
    return;
  }

  if (chosen.length > 2) {
    const itemDiscount = blackFridayDiscounts.primary;
    const config = chosen.reduce(
      (acc, item) => {
        const itemTotalPrice = getCourseTotalPrice(item, itemDiscount);

        return {
          ...acc,
          originalTotalPrice: acc.originalTotalPrice + item.originalPrice,
          currentTotalPrice: acc.currentTotalPrice + itemTotalPrice,
          //  - (acc.currentTotalPrice + itemTotalPrice) *
          //     (PROMO.inUse & !PROMO.isUsed ? PROMO.discount : 0),
        };
      },
      {
        originalTotalPrice: 0,
        currentTotalPrice: 0,
      }
    );
    totalPrice = config;
    updateUI(totalPrice);
    return;
  }
  totalPrice = {
    originalTotalPrice: chosen[0]?.originalPrice,
    currentTotalPrice:
      chosen[0]?.originalPrice -
      chosen[0]?.originalPrice * chosen[0]?.normalDiscount,
    // - (chosen[0]?.originalPrice -
    //   chosen[0]?.originalPrice * chosen[0]?.normalDiscount) *
    //   (PROMO.inUse & !PROMO.isUsed ? PROMO.discount : 0),
  };
  updateUI(totalPrice);
}

function includesArchitectureVanilla(chosen) {
  return chosen.some((item) => item.name === 'ArchitectureVanilla');
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

function findCheckedButtons(...args) {
  return args.filter((item) => item.checked);
}

function getCourseTotalPrice(
  { name, originalPrice, blackFridayDiscount },
  itemDiscount
) {
  if (name === 'TeamLead')
    return originalPrice - originalPrice * blackFridayDiscounts.pentagonal;

  if (name === 'ArchitectureStandart')
    return originalPrice - originalPrice * blackFridayDiscount;

  return originalPrice - originalPrice * itemDiscount;
}

// if radio button is unselected, removes it from chosen array
function findRemovedCourse(chosen) {
  const allRadioButtons = modal.querySelectorAll('input[type="radio"]');

  const notCheckedCourses = [...allRadioButtons]
    .filter((item) => !item.checked)
    .map((item) => item.value);

  return chosen.filter((item) => !notCheckedCourses.includes(item.name));
}

// Returns prioritized course name and discount for second course
function getCourseNameAndDiscount(chosen) {
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

// Returns prioritized course name and black friday discount for every course
function getCourseNameAndBlackFridayDiscount(chosen) {
  const { primary, secondary, tertiary, quaternary, pentagonal } =
    blackFridayDiscounts;

  const prioritizedCourse =
    findFlagShip(chosen) || findUnitTest(chosen) || findAddressables(chosen);

  if (includesArchitectureVanilla(chosen) && findUnitTest(chosen)) {
    return {
      courseName: prioritizedCourse.name,
      firstCourseDiscount: secondary,
      secondCourseDiscount: quaternary,
    };
  }

  if (
    (prioritizedCourse?.isFlagship ||
      prioritizedCourse?.name === 'UnitTesting') &&
    findAddressables(chosen)
  ) {
    return {
      courseName: prioritizedCourse.name,
      firstCourseDiscount: prioritizedCourse.blackFridayDiscount,
      secondCourseDiscount: primary,
    };
  }
  if (
    prioritizedCourse?.isFlagship ||
    prioritizedCourse?.name === 'UnitTesting'
  ) {
    return {
      courseName: prioritizedCourse.name,
      firstCourseDiscount: prioritizedCourse.blackFridayDiscount,
      secondCourseDiscount: quaternary,
    };
  }

  if (prioritizedCourse?.name === 'Addressables') {
    return {
      courseName: prioritizedCourse.name,
      firstCourseDiscount: primary,
      secondCourseDiscount: primary,
    };
  }
  return {
    courseName: '',
    firstCourseDiscount: primary,
    secondCourseDiscount: primary,
  };
}

function updateUI(
  { originalTotalPrice, currentTotalPrice },
  formHasChanged = false
) {
  currentTotalPrice =
    currentTotalPrice -
    currentTotalPrice * (PROMO.inUse && formHasChanged ? PROMO.discount : 0);
  console.log(currentTotalPrice, PROMO.inUse);

  deployPriceChangeAnimation();

  // if no courses were selected
  if (!originalTotalPrice && (isNaN(currentTotalPrice) || !currentTotalPrice)) {
    totalPriceRef.classList.add('hidden');
    totalPriceContainer.cta.classList.remove('hidden');
    return;
  }
  totalPriceRef.classList.remove('hidden');
  totalPriceContainer.cta.classList.add('hidden');

  totalPriceContainer.originalPrice.innerHTML = originalTotalPrice?.toFixed(2);
  totalPriceContainer.currentPrice.innerHTML = currentTotalPrice?.toFixed(2);
  totalPriceContainer.savings.innerHTML = (
    originalTotalPrice - currentTotalPrice
  )?.toFixed(2);

  totalPrice = {
    ...totalPrice,
    currentTotalPrice,
    chosen,
    isBlackFriday: IS_BLACK_FRIDAY,
    promoCode: promoInput.value,
    promoCodeIsUsed: PROMO.isUsed,
    promoInUse: PROMO.inUse,
  };

  localStorage.setItem('formData', JSON.stringify(totalPrice));
}

function deployPriceChangeAnimation() {
  totalPriceContainer.originalPrice.classList.add('price-changed');
  totalPriceContainer.currentPrice.classList.add('price-changed');
  totalPriceContainer.savings.classList.add('price-changed');

  setTimeout(() => {
    totalPriceContainer.originalPrice.classList.remove('price-changed');
    totalPriceContainer.currentPrice.classList.remove('price-changed');
    totalPriceContainer.savings.classList.remove('price-changed');
  }, 1000);
}

function updateChosenList(chosen) {
  chosenListRef.innerHTML = '';

  chosenListRef.insertAdjacentHTML(
    'beforeend',
    chosen.reduce((acc, { name }) => {
      const normalizedName = name.toLowerCase();
      let fileName;
      let courseName;
      if (normalizedName.includes('architecture')) {
        fileName = 'architecture';
        courseName = 'Architecture';
      } else if (normalizedName.includes('addressables')) {
        fileName = 'addresables';
        courseName = 'Addressables';
      } else if (normalizedName.includes('ecs')) {
        fileName = 'ecs';
        courseName = 'ECS';
      } else courseName = name;
      return (
        acc +
        `<li>
          <div class="thumb">
            <img
              width="56"
              height="14"
              src="./images/icon_${fileName}_1x.webp"
              alt="Architecture icon"
              srcset="
                ./images/icon_${fileName}_1x.webp 1x,
                ./images/icon_${fileName}_2x.webp 2x
              "
            />
          </div>
          <div class="wrapper">
            <p>${name}</p>
            <button class="btn-clear" data-name="${courseName}">
              <svg class="icon-delete" width="24" height="24">
                <use href="./images/icons.svg#icon-delete"></use>
              </svg>
            </button>
          </div>
        </li>`
      );
    }, '')
  );
}

function onSubmitForm(e) {
  e.preventDefault();
  alert('Form has been submitted');
}

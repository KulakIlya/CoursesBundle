import courses from '../data.json' assert { type: 'json' };

const IS_BLACK_FRIDAY = false;

let PROMO = {
  code: 'abc',
  discount: 0.5,
  inUse: false,
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

(() => {
  try {
    const data = JSON.parse(localStorage.getItem('formData')) || {};
    const version = localStorage.getItem('version');
    if (version !== '3.0') {
      localStorage.clear();
      return;
    }
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
        promoInput.value = data.promoCode;

        const event = new Event('input');
        promoInput.dispatchEvent(event);

        updateUIAndCalcTotalPrice(totalPrice);
      });
    }
  } catch (error) {
    throw new Error(error);
  }
})();

form.addEventListener(
  'change',
  IS_BLACK_FRIDAY ? onFormChangeIsBlackFriday : onFormChangeIsNotBlackFriday
);

modal.addEventListener('click', onFormClick);

promoInput.addEventListener('input', onPromoInputChange);

function onPromoInputChange() {
  // if promo code is no longer correct (user deleted it)
  if (promoInput.value !== PROMO.code && PROMO.inUse) {
    totalPrice = {
      ...totalPrice,
      currentTotalPrice: totalPrice.currentTotalPrice / PROMO.discount,
    };
    PROMO.inUse = false;

    updateUIAndCalcTotalPrice(totalPrice, false);
    return;
  }
  if (promoInput.value !== PROMO.code || PROMO.inUse) return;

  PROMO.inUse = true;

  totalPrice = {
    ...totalPrice,
    currentTotalPrice: totalPrice.currentTotalPrice * PROMO.discount,
  };

  updateUIAndCalcTotalPrice(totalPrice, false);
}

function onFormClick(e) {
  const closest = e.target.closest('button[type="submit"]');

  if (closest) onSubmitForm(e);
  else onClearBtnClick(e);
}

function onSubmitForm(e) {
  e.preventDefault();
  alert('Form has been submitted');
}

function onClearBtnClick(e) {
  const closest = e.target.closest('.btn-clear');

  if (!closest) return;

  const fieldToClear = form.elements[closest.dataset.name];

  // remove unchecked course from chosen array
  chosen = chosen.filter((item) => item.name !== fieldToClear?.value);

  // if fieldToClear has more than one items
  if (fieldToClear.length)
    findCheckedButtons(...fieldToClear).forEach((item) => {
      item.checked = false;
    });

  fieldToClear.checked = false;

  // Fire change event on form
  const event = new Event('change');
  form.dispatchEvent(event);
}

function onFormChangeIsNotBlackFriday(e) {
  // if promo input changed – do nothing
  if (e.target.name === 'promo') return;

  // get the course from "database"
  const course = courses.find(({ name }) => name === e.target.value);

  if (!e.target.checked)
    chosen = chosen.filter((item) => item.name !== e.target.value);
  else {
    chosen = removeUncheckedCoursesFromChosen(chosen);
    chosen.push({ ...course });
  }

  updateChosenList(chosen);

  if (chosen.length === 2) {
    const { courseName, secondCourseDiscount } =
      getCourseNameAndDiscount(chosen);

    totalPrice = chosen.reduce(
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
        };
      },
      { originalTotalPrice: 0, currentTotalPrice: 0 }
    );
    updateUIAndCalcTotalPrice(totalPrice, true);
    return;
  }

  if (chosen.length > 2) {
    const itemDiscount = discounts.primary;
    totalPrice = chosen.reduce(
      (acc, item) => {
        const itemTotalPrice =
          item.originalPrice -
          item.originalPrice *
            (item.name === 'Architecture Standart' // if course is ArchitectureStandart, it gets normal discount
              ? item.normalDiscount
              : itemDiscount);
        return {
          ...acc,
          originalTotalPrice: acc.originalTotalPrice + item.originalPrice,
          currentTotalPrice: acc.currentTotalPrice + itemTotalPrice,
        };
      },
      {
        originalTotalPrice: 0,
        currentTotalPrice: 0,
      }
    );
    updateUIAndCalcTotalPrice(totalPrice, true);
    return;
  }
  totalPrice = {
    originalTotalPrice: chosen[0]?.originalPrice,
    currentTotalPrice:
      chosen[0]?.originalPrice -
      chosen[0]?.originalPrice * chosen[0]?.normalDiscount,
  };

  updateUIAndCalcTotalPrice(totalPrice, true);
}

function onFormChangeIsBlackFriday(e) {
  // if promo input changed – do nothing
  if (e.target.name === 'promo') return;

  // get the course from "database"
  const course = courses.find(({ name }) => name === e.target.value);

  if (!e.target.checked)
    chosen = chosen.filter((item) => item.name !== e.target.value);
  else {
    chosen = removeUncheckedCoursesFromChosen(chosen);
    chosen.push({ ...course });
  }

  updateChosenList(chosen);

  if (chosen.length === 2) {
    const { courseName, firstCourseDiscount, secondCourseDiscount } =
      getCourseNameAndBlackFridayDiscount(chosen);

    totalPrice = chosen.reduce(
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
        };
      },
      { originalTotalPrice: 0, currentTotalPrice: 0 }
    );

    updateUIAndCalcTotalPrice(totalPrice, true);
    return;
  }

  if (chosen.length > 2) {
    const itemDiscount = blackFridayDiscounts.primary;
    totalPrice = chosen.reduce(
      (acc, item) => {
        const itemTotalPrice = getCourseTotalPrice(item, itemDiscount);

        return {
          ...acc,
          originalTotalPrice: acc.originalTotalPrice + item.originalPrice,
          currentTotalPrice: acc.currentTotalPrice + itemTotalPrice,
        };
      },
      {
        originalTotalPrice: 0,
        currentTotalPrice: 0,
      }
    );

    updateUIAndCalcTotalPrice(totalPrice, true);
    return;
  }
  totalPrice = {
    originalTotalPrice: chosen[0]?.originalPrice,
    currentTotalPrice:
      chosen[0]?.originalPrice -
      chosen[0]?.originalPrice * chosen[0]?.blackFridayDiscount,
  };
  updateUIAndCalcTotalPrice(totalPrice, true);
}

function includesArchitectureVanilla(chosen) {
  return chosen.some((item) => item.name === 'Architecture Vanilla');
}

function includesTeamLead(chosen) {
  return chosen.some((item) => item.name === 'TeamLead');
}

function findFlagShip(chosen) {
  return chosen.find((item) => item.isFlagship);
}

function findUnitTest(chosen) {
  return chosen.find((item) => item.name === 'Unit Testing');
}

function findAddressables(chosen) {
  return chosen.find((item) => item.name === 'Addressables');
}

function findCheckedButtons(...args) {
  return args.filter((item) => item.checked);
}

// For black friday only
function getCourseTotalPrice(
  { name, originalPrice, blackFridayDiscount },
  itemDiscount
) {
  console.log(blackFridayDiscount);
  if (name === 'TeamLead')
    return originalPrice - originalPrice * blackFridayDiscounts.pentagonal;

  if (name === 'Architecture Standart')
    return originalPrice - originalPrice * blackFridayDiscount;

  return originalPrice - originalPrice * itemDiscount;
}

// if radio button is unselected, removes it from chosen array
function removeUncheckedCoursesFromChosen(chosen) {
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
    prioritizedCourse?.name === 'Unit Testing'
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
  return { courseName: '', secondCourseDiscount: primary };
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
      prioritizedCourse?.name === 'Unit Testing') &&
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
    prioritizedCourse?.name === 'Unit Testing'
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

function updateUIAndCalcTotalPrice(
  { originalTotalPrice, currentTotalPrice },
  formHasChanged = false
) {
  currentTotalPrice =
    currentTotalPrice -
    currentTotalPrice * (PROMO.inUse && formHasChanged ? PROMO.discount : 0);

  firePriceChangeAnimation();

  // if no courses were selected
  if (!originalTotalPrice && (isNaN(currentTotalPrice) || !currentTotalPrice)) {
    totalPriceRef.classList.add('hidden');
    totalPriceContainer.cta.classList.remove('hidden');
    return;
  }
  totalPriceRef.classList.remove('hidden');
  totalPriceContainer.cta.classList.add('hidden');

  // update price UI
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
    promoInUse: PROMO.inUse,
  };

  localStorage.setItem('formData', JSON.stringify(totalPrice));
  localStorage.setItem('version', '3.0');
}

function firePriceChangeAnimation() {
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
              src="./images/icon_${fileName?.toLowerCase()}_1x.webp"
              alt="Architecture icon"
              srcset="
                ./images/icon_${fileName?.toLowerCase()}_1x.webp 1x,
                ./images/icon_${fileName?.toLowerCase()}_2x.webp 2x
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

document.addEventListener("DOMContentLoaded", () => {
  const totalPriceElement = document.getElementById("totalPrice");
  const savingsElement = document.getElementById("savings");

  const inputs = document.querySelectorAll(
    'input[name="courses"], input[type="radio"]'
  );

  inputs.forEach((input) => {
    input.addEventListener("change", calculateAndDisplayTotalPrice);
  });

  function calculateAndDisplayTotalPrice() {
    const selectedOptions = document.querySelectorAll(
      'input[name="courses"]:checked, input[type="radio"]:checked'
    );

    let total = 0;
    let oldTotal = 0;
    let hasFlagshipCourse = false;

    selectedOptions.forEach((option) => {
      const course = option.value;
      const { originalPrice, normalDiscount, isFlagship } = courses[course];
      const standardDiscountPrice =
        originalPrice - originalPrice * normalDiscount;
      let discountedPrice = standardDiscountPrice;

      if (isFlagship) {
        hasFlagshipCourse = true;
      } else if (!hasFlagshipCourse) {
        discountedPrice = standardDiscountPrice;
      }

      oldTotal += standardDiscountPrice;
      total += discountedPrice;
    });

    if (hasFlagshipCourse) {
      total = 0;
      selectedOptions.forEach((option) => {
        const course = option.value;
        const { originalPrice, isFlagship } = courses[course];
        let discountedPrice =
          originalPrice - originalPrice * (isFlagship ? 0.13 : 0.4);
        total += discountedPrice;
      });
    }

    const savings = oldTotal - total;
    totalPriceElement.innerHTML = `Итоговая цена выбранных курсов: <s>${oldTotal.toFixed(
      2
    )}</s> ${total.toFixed(2)} USD.`;
    savingsElement.textContent = `Ваша экономия: ${savings.toFixed(2)} USD.`;
  }

  calculateAndDisplayTotalPrice();
});

const courses = {
  ArchitectureVanilla: {
    originalPrice: 580,
    normalDiscount: 0.13,
    isFlagship: true,
  },
  ArchitectureStandart: {
    originalPrice: 950,
    normalDiscount: 0.13,
    isFlagship: true,
  },
  ECSVanilla: { originalPrice: 600, normalDiscount: 0.07, isFlagship: true },
  ECSStandart: { originalPrice: 960, normalDiscount: 0.07, isFlagship: true },
  TeamLead: { originalPrice: 299, normalDiscount: 0.13, isFlagship: false },
  UnitTesting: { originalPrice: 550, normalDiscount: 0.13, isFlagship: false },
  AI: { originalPrice: 250, normalDiscount: 0.32, isFlagship: false },
  Addressables: { originalPrice: 250, normalDiscount: 0, isFlagship: false },
};

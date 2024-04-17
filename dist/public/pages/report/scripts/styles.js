"use strict";
function addEffect(triggerClassName, targetClassName, classListToBeAdded) {
    const triggerElements = document.querySelectorAll(triggerClassName);
    triggerElements.forEach((triggerElement) => {
        triggerElement.addEventListener('mouseover', () => {
            const targetElements = document.querySelectorAll(targetClassName);
            targetElements.forEach((targetElement) => {
                targetElement.classList.add(classListToBeAdded);
            });
        });
        triggerElement.addEventListener('mouseout', () => {
            const targetElements = document.querySelectorAll(targetClassName);
            targetElements.forEach((targetElement) => {
                targetElement.classList.remove(classListToBeAdded);
            });
        });
    });
}
const depthSlider = document.getElementById('depth-slider');
depthSlider.addEventListener('input', () => {
    const minValue = parseFloat(depthSlider.min);
    const maxValue = parseFloat(depthSlider.max);
    const sliderValue = parseFloat(depthSlider.value);
    const percentage = ((sliderValue - minValue) / (maxValue - minValue)) * 100;
    const gradientValue = `linear-gradient(to right, #4caf50 0%, #4caf50 ${percentage}%, var(--secondary-color) ${percentage}%, var(--secondary-color) 100%)`;
    depthSlider.style.background = gradientValue;
});
addEffect('.logo', '.knight', "fa-bounce");
addEffect(".analyse", ".mag", "fa-shake");

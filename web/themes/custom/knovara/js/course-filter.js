(function (Drupal, once) {
  'use strict';

  let pendingInterfaceState = null;

  Drupal.behaviors.courseExposedFilters = {
    attach(context) {
      once(
        'course-exposed-filters',
        '[data-course-filter-controls]',
        context
      ).forEach((controls) => {
        const form = controls.closest('form');
        const searchInput = controls.querySelector(
          '[name="course_search"]'
        );
        const categorySelect = controls.querySelector(
          'select[name="course_category"]'
        );
        const chipGroup = controls.querySelector(
          '[data-course-filter-chips]'
        );

        if (!form || !categorySelect || !chipGroup) {
          return;
        }

        const submitButton = form.querySelector(
          'input[type="submit"], button[type="submit"]'
        );

        if (!submitButton) {
          return;
        }

        const categoryOptions = Array.from(categorySelect.options).filter(
          (option) => !option.disabled
        );

        const anyOption = categoryOptions.find(
          (option) => option.value === 'All' || option.value === ''
        );

        const allValue = anyOption ? anyOption.value : 'All';

        categoryOptions.forEach((option) => {
          const isAll = option.value === allValue;
          const button = document.createElement('button');

          button.type = 'button';
          button.className = 'filter-chip';
          button.dataset.filterValue = isAll
            ? '__all__'
            : option.value;
          button.setAttribute('aria-pressed', 'false');
          button.textContent = isAll
            ? Drupal.t('All')
            : option.textContent.trim();

          chipGroup.appendChild(button);
        });

        const filterButtons = Array.from(
          chipGroup.querySelectorAll('[data-filter-value]')
        );

        if (searchInput) {
          searchInput.classList.add('filter-search');
          searchInput.placeholder = Drupal.t('Search courses');

          searchInput
            .closest('.form-item')
            ?.querySelector('label')
            ?.classList.add('visually-hidden');
        }

        const getButtonValue = (button) =>
          button.dataset.filterValue === '__all__'
            ? allValue
            : button.dataset.filterValue;

        const saveInterfaceState = (focusData) => {
          pendingInterfaceState = {
            scrollY: window.scrollY,
            focusData
          };
        };

        const restoreInterfaceState = () => {
          if (!pendingInterfaceState) {
            return;
          }

          const savedState = pendingInterfaceState;
          pendingInterfaceState = null;

          /*
           * Allow Drupal Views AJAX to replace the View before restoring
           * the previous scroll position and keyboard focus.
           */
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              window.scrollTo({
                top: savedState.scrollY,
                left: 0,
                behavior: 'auto'
              });

              let focusElement = null;

              if (savedState.focusData?.type === 'search') {
                focusElement = searchInput;
              }

              if (savedState.focusData?.type === 'chip') {
                focusElement = filterButtons.find(
                  (button) =>
                    button.dataset.filterValue ===
                    savedState.focusData.value
                );
              }

              if (focusElement) {
                focusElement.focus({ preventScroll: true });
              }

              if (
                focusElement === searchInput &&
                typeof savedState.focusData.selectionStart === 'number'
              ) {
                searchInput.setSelectionRange(
                  savedState.focusData.selectionStart,
                  savedState.focusData.selectionEnd
                );
              }
            });
          });
        };

        const submitFilters = () => {
          submitButton.click();
        };

        const updateActiveButton = () => {
          const selectedValue = categorySelect.value || allValue;

          filterButtons.forEach((button) => {
            const isActive = getButtonValue(button) === selectedValue;

            button.setAttribute(
              'aria-pressed',
              isActive ? 'true' : 'false'
            );

            button.classList.toggle('is-active', isActive);
          });
        };

        filterButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const requestedValue = button.dataset.filterValue;
            const nextValue = getButtonValue(button);

            if (categorySelect.value === nextValue) {
              return;
            }

            saveInterfaceState({
              type: 'chip',
              value: requestedValue
            });

            categorySelect.value = nextValue;
            updateActiveButton();
            submitFilters();
          });
        });

        if (searchInput) {
          let searchTimer;

          searchInput.addEventListener('input', () => {
            window.clearTimeout(searchTimer);

            searchTimer = window.setTimeout(() => {
              saveInterfaceState({
                type: 'search',
                selectionStart: searchInput.selectionStart,
                selectionEnd: searchInput.selectionEnd
              });

              submitFilters();
            }, 400);
          });
        }

        updateActiveButton();
        restoreInterfaceState();
      });
    }
  };
})(Drupal, once);

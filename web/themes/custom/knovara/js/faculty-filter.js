(function (Drupal, once) {
  'use strict';

  let pendingInterfaceState = null;

  Drupal.behaviors.facultyExposedFilters = {
    attach(context) {
      once(
        'faculty-exposed-filters',
        '[data-faculty-filter-controls]',
        context
      ).forEach((controls) => {
        const form = controls.closest('form');
        const searchInput = controls.querySelector('[name="search"]');
        const typeSelect = controls.querySelector('[name="type"]');

        const filterButtons = Array.from(
          controls.querySelectorAll('[data-filter-value]')
        );

        if (!form || !typeSelect) {
          return;
        }

        const submitButton = form.querySelector(
          'input[type="submit"], button[type="submit"]'
        );

        if (!submitButton) {
          return;
        }

        const anyOption = Array.from(typeSelect.options).find(
          (option) => option.value === 'All' || option.value === ''
        );

        const allValue = anyOption ? anyOption.value : 'All';

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
           * Two animation frames allow Drupal Views AJAX to finish replacing
           * the View before restoring the previous browser position.
           */
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              window.scrollTo({
                top: savedState.scrollY,
                left: 0,
                behavior: 'instant'
              });

              let focusElement = null;

              if (savedState.focusData?.type === 'search') {
                focusElement = searchInput;
              }

              if (savedState.focusData?.type === 'chip') {
                focusElement = controls.querySelector(
                  `[data-filter-value="${savedState.focusData.value}"]`
                );
              }

              if (focusElement) {
                focusElement.focus({
                  preventScroll: true
                });
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
          const selectedValue = typeSelect.value || allValue;

          filterButtons.forEach((button) => {
            const buttonValue =
              button.dataset.filterValue === '__all__'
                ? allValue
                : button.dataset.filterValue;

            const isActive = buttonValue === selectedValue;

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

            const nextValue =
              requestedValue === '__all__'
                ? allValue
                : requestedValue;

            /*
             * Active button dobara click hone par unnecessary AJAX request
             * nahi bhejni hai.
             */
            if (typeSelect.value === nextValue) {
              return;
            }

            saveInterfaceState({
              type: 'chip',
              value: requestedValue
            });

            typeSelect.value = nextValue;

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

        /*
         * AJAX ke baad new filter form par behavior dobara attach hota hai.
         * Usi samay previous scroll aur focus restore hoga.
         */
        restoreInterfaceState();
      });
    }
  };
})(Drupal, once);
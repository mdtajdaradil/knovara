(function (Drupal, once) {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);

  const $$ = (selector, context = document) =>
    Array.from(context.querySelectorAll(selector));

  const announce = (message) => {
    let region = $("[data-live-region]");

    if (!region) {
      region = document.createElement("div");
      region.dataset.liveRegion = "";
      region.className = "visually-hidden";
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }

    region.textContent = "";

    window.setTimeout(() => {
      region.textContent = message;
    }, 50);
  };

  const toast = (message) => {
    const oldToast = $(".toast");

    if (oldToast) {
      oldToast.remove();
    }

    const node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.textContent = message;

    document.body.appendChild(node);

    window.setTimeout(() => {
      node.remove();
    }, 3600);
  };

  const setupPublicMenu = (context) => {
    once("knovara-public-menu", "[data-menu-toggle]", context).forEach(
      (button) => {
        const nav = $("[data-primary-nav]");

        if (!nav) {
          return;
        }

        button.addEventListener("click", () => {
          const open = button.getAttribute("aria-expanded") === "true";

          button.setAttribute("aria-expanded", String(!open));

          nav.classList.toggle("is-open", !open);
        });
      }
    );
  };

  const setupAppMenu = (context) => {
    once("knovara-app-menu", "[data-app-menu-toggle]", context).forEach(
      (button) => {
        const sidebar = $("[data-app-sidebar]");

        if (!sidebar) {
          return;
        }

        button.addEventListener("click", () => {
          const open = button.getAttribute("aria-expanded") === "true";

          button.setAttribute("aria-expanded", String(!open));

          sidebar.classList.toggle("is-open", !open);
        });

        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
            sidebar.classList.remove("is-open");
            button.setAttribute("aria-expanded", "false");
            button.focus();
          }
        });
      }
    );
  };

  const setupFilters = (context) => {
    once("knovara-filter-group", "[data-filter-group]", context).forEach(
      (group) => {
        const buttons = $$("[data-filter]", group);
        const targetId = group.dataset.target;
        const target = document.getElementById(targetId);

        if (!target) {
          return;
        }

        const cards = $$("[data-category]", target);
        const search = $("[data-filter-search]", group);
        const count = $("[data-result-count]", group);

        const render = () => {
          const selected =
            $('[data-filter][aria-pressed="true"]', group)?.dataset.filter ||
            "all";

          const term = (search?.value || "").trim().toLowerCase();

          let visible = 0;

          cards.forEach((card) => {
            const categories = card.dataset.category?.split(" ") || [];

            const categoryMatch =
              selected === "all" || categories.includes(selected);

            const textMatch =
              !term || card.textContent.toLowerCase().includes(term);

            const show = categoryMatch && textMatch;

            card.hidden = !show;

            if (show) {
              visible += 1;
            }
          });

          if (count) {
            count.textContent = `${visible} result${visible === 1 ? "" : "s"}`;
          }

          announce(`${visible} results shown`);
        };

        buttons.forEach((button) => {
          button.addEventListener("click", () => {
            buttons.forEach((item) => {
              item.setAttribute("aria-pressed", String(item === button));
            });

            render();
          });
        });

        search?.addEventListener("input", render);
      }
    );
  };

  const setupAccordions = (context) => {
    once("knovara-accordion", "[data-accordion-trigger]", context).forEach(
      (button) => {
        button.addEventListener("click", () => {
          const expanded = button.getAttribute("aria-expanded") === "true";

          const panelId = button.getAttribute("aria-controls");

          const panel = panelId ? document.getElementById(panelId) : null;

          button.setAttribute("aria-expanded", String(!expanded));

          if (panel) {
            panel.hidden = expanded;
          }
        });
      }
    );
  };

  const setupPasswordToggles = (context) => {
    once("knovara-password-toggle", "[data-password-toggle]", context).forEach(
      (button) => {
        const input = document.getElementById(button.dataset.passwordToggle);

        if (!input) {
          return;
        }

        button.addEventListener("click", () => {
          const showing = input.type === "text";

          input.type = showing ? "password" : "text";

          button.textContent = showing ? "Show" : "Hide";

          button.setAttribute("aria-pressed", String(!showing));
        });
      }
    );
  };

  const setupForms = (context) => {
    once("knovara-demo-form", "[data-demo-form]", context).forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.reportValidity()) {
          return;
        }

        const message =
          form.dataset.success || "Thank you. Your details have been received.";

        const success = $("[data-form-message]", form);

        if (success) {
          success.textContent = message;
          success.hidden = false;
          success.focus();
        } else {
          toast(message);
        }
      });
    });
  };

  const setupRegistration = (context) => {
    once("knovara-registration", "[data-registration]", context).forEach(
      (form) => {
        const panels = $$("[data-step-panel]", form);
        const indicators = $$(".step", form);

        if (!panels.length) {
          return;
        }

        let current = 0;

        const show = (index) => {
          panels.forEach((panel, panelIndex) => {
            panel.hidden = panelIndex !== index;
          });

          indicators.forEach((step, stepIndex) => {
            step.classList.toggle("is-complete", stepIndex < index);

            if (stepIndex === index) {
              step.setAttribute("aria-current", "step");
            } else {
              step.removeAttribute("aria-current");
            }
          });

          current = index;

          panels[index].querySelector("input, select, button")?.focus();

          announce(`Registration step ${index + 1} of ${panels.length}`);
        };

        $$("[data-step-next]", form).forEach((button) => {
          button.addEventListener("click", () => {
            const currentPanel = panels[current];

            const required = $$(
              "input[required], select[required]",
              currentPanel
            );

            const hasInvalidField = required.some(
              (field) => !field.reportValidity()
            );

            if (hasInvalidField) {
              return;
            }

            show(Math.min(current + 1, panels.length - 1));
          });
        });

        $$("[data-step-back]", form).forEach((button) => {
          button.addEventListener("click", () => {
            show(Math.max(current - 1, 0));
          });
        });
      }
    );
  };

  const setupBookmarks = (context) => {
    once("knovara-bookmark", "[data-bookmark]", context).forEach((button) => {
      button.addEventListener("click", () => {
        const saved = button.getAttribute("aria-pressed") === "true";

        button.setAttribute("aria-pressed", String(!saved));

        button.textContent = saved ? "Save" : "Saved ✓";

        toast(
          saved ? "Removed from saved resources." : "Saved to your library."
        );
      });
    });
  };

  const setupCourseTabs = (context) => {
    once("knovara-course-tabs", "[data-tabs]", context).forEach((tabs) => {
      const buttons = $$('[role="tab"]', tabs);

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          buttons.forEach((item) => {
            const selected = item === button;

            item.setAttribute("aria-selected", String(selected));

            const panelId = item.getAttribute("aria-controls");

            const panel = panelId ? document.getElementById(panelId) : null;

            if (panel) {
              panel.hidden = !selected;
            }
          });
        });
      });
    });
  };

  const setupCalendar = (context) => {
    once("knovara-calendar", "[data-calendar-label]", context).forEach(
      (label) => {
        const months = ["August 2026", "September 2026", "October 2026"];

        let index = 1;

        $$("[data-calendar-move]").forEach((button) => {
          button.addEventListener("click", () => {
            index = Math.max(
              0,
              Math.min(
                months.length - 1,
                index + Number(button.dataset.calendarMove)
              )
            );

            label.textContent = months[index];

            announce(`${months[index]} calendar shown`);
          });
        });
      }
    );
  };

  const setupLesson = (context) => {
    once("knovara-lesson-complete", "[data-mark-complete]", context).forEach(
      (button) => {
        button.addEventListener("click", () => {
          button.textContent = "Lesson completed ✓";

          button.disabled = true;

          toast("Progress updated to 69%.");

          const progress = $("[data-lesson-progress]");

          if (progress) {
            progress.value = 69;
          }
        });
      }
    );
  };

  const setupCoupon = (context) => {
    once("knovara-coupon", "[data-coupon-form]", context).forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const input = $("input", form);
        const discount = $("[data-discount]");
        const total = $("[data-total]");

        if (!input || !discount || !total) {
          return;
        }

        if ((input.value || "").trim().toUpperCase() === "LEARN10") {
          discount.textContent = "− ₹500";
          total.textContent = "₹4,499";

          toast("Coupon LEARN10 applied.");
        } else {
          toast("Try demo code LEARN10.");
        }
      });
    });
  };

  const setupPrint = (context) => {
    once("knovara-print", "[data-print]", context).forEach((button) => {
      button.addEventListener("click", () => {
        window.print();
      });
    });
  };

  Drupal.behaviors.knovara = {
    attach(context) {
      setupPublicMenu(context);
      setupAppMenu(context);
      setupFilters(context);
      setupAccordions(context);
      setupPasswordToggles(context);
      setupForms(context);
      setupRegistration(context);
      setupBookmarks(context);
      setupCourseTabs(context);
      setupCalendar(context);
      setupLesson(context);
      setupCoupon(context);
      setupPrint(context);
    },
  };
})(Drupal, once);

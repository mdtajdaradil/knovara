(function (Drupal, once) {
  "use strict";

  Drupal.behaviors.knovaraCourseDetail = {
    attach(context) {
      once(
        "knovara-course-detail-initial-state",
        "[data-course-curriculum]",
        context
      ).forEach((accordion) => {
        const triggers = Array.from(
          accordion.querySelectorAll("[data-accordion-trigger]")
        );

        triggers.forEach((trigger, index) => {
          const panelId = trigger.getAttribute("aria-controls");
          const panel = panelId ? document.getElementById(panelId) : null;
          const open = index === 0;

          trigger.setAttribute("aria-expanded", String(open));

          if (panel) {
            panel.hidden = !open;
          }
        });
      });
    },
  };
})(Drupal, once);

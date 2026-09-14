# Knovara Dynamic Course Detail

This package converts every Course canonical node page into the original
`course-detail.html` UI. It uses the existing Course fields, Course Module
Paragraphs, Faculty references, shared Knovara components, and the accordion
handler already present in `main.js`.

No Course-detail View is required. Drupal renders these pages through the
Course node's **Full content** view mode and
`node--course--full.html.twig`.

## What becomes dynamic

| UI area | Drupal source |
| --- | --- |
| Breadcrumb title and H1 | Course node title |
| Hero eyebrow | `field_course_category` + `field_course_level` |
| Hero lead | `field_course_summary` |
| Duration | `field_course_duration` |
| Lesson count | `field_course_lessons` |
| Project count | `field_course_projects` |
| Certificate text | `field_course_certificate` |
| Overview H2 | `field_course_overview_heading` |
| Overview copy | `body` |
| What you will learn | `field_learning_outcomes` |
| Curriculum accordions | `field_course_curriculum` Paragraphs |
| Accordion title | `field_module_title` |
| Accordion panel | `field_module_summary` |
| Capstone | `field_capstone_project` |
| Requirements | `field_course_requirements` |
| Enrollment badge | `field_enrollment_status` |
| Price | `field_course_price` |
| Payment note | `field_course_payment_note` |
| Enroll button URL/title | `field_course_enroll_link` |
| Start date | `field_course_start_date` |
| Rail checklist | `field_course_benefits` |
| Instructor photo/name/role/link | Referenced `field_course_instructor` Faculty node |

## Files to copy

Theme root in this guide:

```text
web/themes/custom/knovara
```

| Package file | Destination |
| --- | --- |
| `templates/content/node--course--full.html.twig` | `templates/content/node--course--full.html.twig` |
| `templates/paragraphs/paragraph--course-module.html.twig` | `templates/paragraphs/paragraph--course-module.html.twig` |
| `templates/layout/page.html.twig` | Replace the current corrected `templates/layout/page.html.twig` |
| `css/course-detail.css` | `css/course-detail.css` |
| `js/course-detail.js` | `js/course-detail.js` |

The supplied page template is based on the corrected `/courses` listing page.
Its only Course-detail change is adding `is_course_detail` to
`self_contained_main`. That prevents Drupal's generic outer section/shell from
wrapping the Course hero and detail sections.

Do not replace `main.js`. Its existing `setupAccordions()` function already
handles click/keyboard activation. The new `course-detail.js` only opens the
first curriculum module when the page initially loads.

## 1. Add the library

Open:

```text
web/themes/custom/knovara/knovara.libraries.yml
```

Copy the complete block from
`snippets/knovara.libraries.course-detail.yml` to the root level, preferably
immediately after the existing `courses:` library.

Required final block:

```yaml
course-detail:
  css:
    theme:
      css/course-detail.css: {}
  js:
    js/course-detail.js: {}
  dependencies:
    - knovara/courses
    - core/drupal
    - core/once
```

Important:

- `course-detail:` must start at the far-left/root level.
- Do not place it inside `courses:`.
- Keep the existing `courses:` and `course-filter:` libraries unchanged.
- The Full Course template attaches `knovara/course-detail` automatically.

## 2. Add the Course-detail page flag

Open:

```text
web/themes/custom/knovara/knovara.theme
```

Find the existing function:

```php
function knovara_preprocess_page(array &$variables): void {
```

Inside that function, add the executable block from
`snippets/knovara.theme-course-detail.php`:

```php
$route_match = \Drupal::routeMatch();
$route_node = $route_match->getParameter('node');

$variables['is_course_detail'] =
  $route_match->getRouteName() === 'entity.node.canonical'
  && $route_node instanceof \Drupal\node\NodeInterface
  && $route_node->bundle() === 'course';
```

Do not create a second `knovara_preprocess_page()` function. If that function
already defines `$route_match`, reuse the existing variable and add only
`$route_node` plus the `is_course_detail` assignment.

If your theme does not yet contain `knovara_preprocess_page()`, create it once:

```php
function knovara_preprocess_page(array &$variables): void {
  $route_match = \Drupal::routeMatch();
  $route_node = $route_match->getParameter('node');

  $variables['is_course_detail'] =
    $route_match->getRouteName() === 'entity.node.canonical'
    && $route_node instanceof \Drupal\node\NodeInterface
    && $route_node->bundle() === 'course';
}
```

## 3. Configure Course → Full content display

Go to:

```text
/admin/structure/types/manage/course/display
```

1. Open **Custom display settings** at the bottom.
2. Check **Full content**.
3. Leave unrelated view modes as they are.
4. Click **Save**.
5. Open the new **Full content** tab.

Keep these five formatted/rendered fields enabled:

| Field | Label | Formatter/settings |
| --- | --- | --- |
| Course Description | Hidden | Default; do not use Trimmed |
| Learning Outcomes | Hidden | Default |
| Course Curriculum | Hidden | Rendered entity; view mode Default |
| Capstone Project | Hidden | Default |
| Course Requirements | Hidden | Default |

Move other Course fields to **Disabled** in Full content. The custom template
reads their safe scalar/entity values directly and places them in the original
UI. Disabling the automatic formatter output prevents accidental duplicate
field markup if `{{ content }}` is added elsewhere later.

Save the Full content display.

## 4. Configure Course Module → Default display

Go to:

```text
/admin/structure/paragraphs_type/course_module/display
```

Use these settings:

| Field | Status | Label | Formatter |
| --- | --- | --- | --- |
| Module Title | Disabled | — | The Paragraph Twig prints it in the button |
| Module Summary | Enabled | Hidden | Default |

Save the display.

Also confirm the Course Curriculum field allows multiple values so every
module can be added to the Course. Confirm Course Benefits allows multiple
values if you want several rail checklist items. The template automatically
adds the Course Start Date as the first checklist item.

## 5. Content-entry rules

- Enter **Learning Outcomes** as a bulleted list in the formatted-text editor.
- Add each curriculum module as a separate **Course Module** Paragraph.
- Enter only the module name in **Module Title**. If you want numbering in the
  UI, enter titles such as `Module 1 · Semantic foundations`.
- Add one Course Benefit per field item, for example `English · Hindi support`.
- Enrollment Link can contain both the destination URL and optional link text.
  When link text is empty, the button uses `Enroll now`.
- Faculty photo/name/role come directly from the referenced Faculty node; do
  not duplicate them in Course fields.
- Requirements are optional. When empty, that section is not rendered.

## 6. Rebuild caches

From the project root run:

```bash
ddev drush cr
```

Then hard-refresh one Course node URL with `Ctrl + Shift + R`.

## 7. Verify the result

Open a published Course node and run this in the browser console:

```js
const detail = document.querySelector('.course-detail-node');
const modules = [...document.querySelectorAll('[data-accordion-trigger]')];

console.log({
  detailFound: Boolean(detail),
  heroes: document.querySelectorAll('main .page-hero').length,
  rails: detail?.querySelectorAll('.detail-rail').length ?? 0,
  modules: modules.length,
  openModules: modules.filter(
    (button) => button.getAttribute('aria-expanded') === 'true'
  ).length,
  courseDetailLibrary: Boolean(Drupal?.behaviors?.knovaraCourseDetail),
});
```

Expected result when the node has curriculum:

```js
{
  detailFound: true,
  heroes: 1,
  rails: 1,
  modules: 4,       // or the number entered on this Course
  openModules: 1,
  courseDetailLibrary: true
}
```

Click every accordion button and verify that its `aria-expanded` state and
matching panel visibility change together. Also test a Course with optional
fields empty; the template should remove those sections cleanly without empty
headings.

## If the page is still wrapped or the hero is duplicated

Run:

```js
console.log({
  detail: document.querySelectorAll('.course-detail-node').length,
  heroes: document.querySelectorAll('main .page-hero').length,
  outerMainContent: Boolean(
    document.querySelector('main > section > .shell > .main-content .course-detail-node')
  )
});
```

`outerMainContent: true` means `is_course_detail` was not set. Recheck the
`knovara.theme` preprocess block and rebuild Drupal caches.

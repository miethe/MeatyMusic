# Design Guidelines – AMCS Web Application

These guidelines summarise the visual identity and interaction patterns for the Agentic Music Creation System.  They complement the **Website PRD** by providing specific recommendations for colours, typography, spacing and component use.  The goal is to create a cohesive, modern interface that feels both creative and professional.

## 1. Colour Palette

| Role                  | Colour                | Notes                                             |
|----------------------|----------------------|---------------------------------------------------|
| Background           | #0F0F1C              | Very dark navy; the app’s primary background.     |
| Surface (cards)      | #1A1A2A              | Slightly lighter; used for panels and cards.      |
| Primary Accent       | #6D42F5              | Purple accent for primary actions (buttons, links).|
| Secondary Accent     | #0070F3              | Electric blue used for highlights and active states.|
| Text (high contrast) | #FFFFFF              | White or near white for headings.                 |
| Text (secondary)     | #B3B3C6              | Light grey for labels and metadata.               |
| Error                | #E05361              | Red/pink for errors or destructive actions.       |
| Success              | #2EB67D              | Green for positive states and success messages.   |
| Warning              | #E3A652              | Amber for warning or caution messages.            |

Use subtle gradients or transparencies when layering surfaces.  For example, modals may use a backdrop of `rgba(15,15,28,0.85)`.

## 2. Typography

* **Primary Font**: Inter, Roboto or any modern sans‑serif with good readability.  Use a font‑weight range (300–700) for hierarchy.
* **Heading Sizes**:
  * H1 – 32 px, bold
  * H2 – 24 px, semi‑bold
  * H3 – 20 px, medium
  * Body – 16 px, regular
  * Caption/Labels – 14 px, regular
* **Letter Spacing**: Slightly increased (0.5 px) on uppercase labels and buttons.  Normal spacing on body text.
* Maintain clear line‑height (e.g., 1.4×) for readability.

## 3. Spacing & Layout

* Use a **8‑point grid** for spacing multiples (8 px, 16 px, 24 px).  Components should align to this grid.
* Keep consistent padding inside cards (e.g., 16 px) and around form elements.
* Separate sections with generous breathing room; avoid clutter.
* Use columns and grids to align input fields.  For wide screens, two‑column layouts reduce scroll length.

## 4. Components

* **Navigation Drawer**: Persistent on desktop; collapses into a hamburger menu on mobile.  Include icons and labels; highlight the active route with the secondary accent colour.
* **Top Bar**: Contains the app logo, breadcrumb navigation, notifications and user avatar.  Avoid overcrowding.
* **Cards**: Elevated panels with slight shadow (e.g., 4 dp).  Use for lists (styles, lyrics, personas) and dashboards.  Include actions (edit, duplicate, delete) as icons aligned to the right.
* **Buttons**: Primary buttons use the purple accent and are filled; secondary buttons use a ghost/outlined style with blue accent.  Rounded corners (4 px radius).
* **Chips**: For multi‑select fields.  Use filled chips with the secondary accent when selected; ghost style when unselected.  Add a small `×` icon to remove selections.
* **Sliders/Range Inputs**: Represent ranges like tempo (BPM).  Use dual‑knob sliders with clear min/max labels.  Track colours reflect selection.
* **Dropdowns**: Use searchable dropdowns for long lists (e.g., key modulations, sources).  Consider grouping options (e.g., keys by major/minor).
* **Modals & Drawers**: For actions like creating a new entity or editing settings.  Full‑screen on mobile; centred with fixed width on desktop.
* **JSON Preview**: Present specs in a code‑styled panel with monospaced font and syntax highlighting.  Collapsible sections help readability.

## 5. Interactions & Feedback

* **Inline Validation**: Validate inputs as users type.  Use coloured icons and concise text to convey issues or success.
* **Tooltips**: Provide guidance on advanced fields (e.g., explaining rhyme schemes, meter, meta tags).  Appear on hover or tap.
* **Progress Indicators**: Use spinners or progress bars during asynchronous actions (e.g., running Claude Code, submitting render jobs).  For multi‑step processes, show a stepper.
* **Notifications**: Display toast notifications or pop‑ups for completed runs, render job results and errors.  Use colour coding (green for success, red for errors).
* **Keyboard Accessibility**: Ensure all interactive elements support focus styles and keyboard navigation.  Provide `aria` labels where necessary.

## 6. Imagery & Icons

* Use custom illustrations sparingly to evoke creativity (e.g., musical notes, abstract waves).  Avoid stock photos of performers to prevent rights issues.
* Prefer outline icons for navigation and actions.  Use a consistent icon library (e.g., Heroicons, FontAwesome) and limit the number of distinct icon styles.
* The generated concept art (dashboard, style editor, lyrics editor, persona editor) serves as inspiration for layout and component arrangement.  The dark, futuristic aesthetic should guide the final design.

## 7. Responsiveness

* Build layouts mobile‑first.  Use CSS Grid/Flexbox to adjust from single column on mobile to multi‑column on tablet and desktop.
* Collapse side navigation into a hamburger menu below 768 px width.  Use bottom navigation on very small devices if necessary.
* Ensure forms remain usable on small screens.  Use accordions or steppers to group optional fields.

## 8. Accessibility

* Maintain colour contrast ratios (≥ 4.5:1) between text and background.  Use accessible colour combinations for error and success states.
* Provide descriptive `aria` labels and roles for interactive components.
* Ensure screen‑reader compatibility for dynamic content (e.g., notifications, modals).  Focus management is critical when dialogs open or close.

## 9. Voice & Tone

* Write UI copy in a friendly and empowering tone.  Encourage users to experiment and explore creativity.
* Avoid jargon except where necessary (e.g., “Rhyme Scheme”).  Provide tooltips or help links for advanced terms.
* Use concise labels and action verbs (e.g., “Add Source”, “Generate Lyrics”).

## 10. References

* **Meta Tag Guidance** – Suno prompts should include structural tags, voice and instrument tags to guide arrangement【290562151583449†L313-L333】.
* **Prompt Best Practices** – Keep prompts short, include BPM and mood, add special elements for uniqueness【76184295849824†L412-L418】.
* **Iterative Refinement** – Use iterative experimentation to improve results【76184295849824†L420-L429】.


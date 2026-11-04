/**
 * The kit's own texts: every word a component writes or names on its own,
 * grouped by component, with the English that ships with the kit.
 *
 * An application in another language translates them once, with `messages` on
 * SiteplaneLocaleProvider: a partial object in the shape of this catalog, in
 * which every text it leaves out keeps its English default. A prop of a
 * component, such as Pagination's `labels` or a Dialog close's `aria-label`,
 * still changes that one instance. Dates are not here: the date and time
 * components write them in the provider's locale, and React Aria its own
 * texts, such as the month names, in the locale's language.
 *
 * A text with values, such as a count or a name, is a function that receives
 * them and returns the text, so a translation keeps its own word order and its
 * own plural forms. Pagination's `pageStatus` is the one template: its values
 * can be elements, which the kit sets where `{page}` and `{total}` stand.
 *
 * This module holds no React context and no client code, so a Server
 * Component can import the English defaults and the types.
 */

import {
  englishModalBlockMessages,
  type ModalBlockMessageGroups,
} from "./modal-block-messages";

/**
 * The words of a Pagination. `labels` on Pagination replaces them for one
 * Pagination, merged with the messages of SiteplaneLocaleProvider.
 */
export type PaginationLabels = {
  /** The name of the navigation landmark: "pagination" by default. */
  navigation: string;
  /** The text of PaginationPrevious: "Previous" by default. */
  previous: string;
  /** The accessible name of PaginationPrevious: "Go to previous page" by default. */
  previousPage: string;
  /** The text of PaginationNext: "Next" by default. */
  next: string;
  /** The accessible name of PaginationNext: "Go to next page" by default. */
  nextPage: string;
  /** The hidden text of PaginationEllipsis: "More pages" by default. */
  morePages: string;
  /**
   * The text of PaginationStatus: "Page {page} of {total}" by default.
   * `{page}` and `{total}` stand where the numbers go, so a translation keeps
   * its own word order.
   */
  pageStatus: string;
};

/**
 * The words of a PageIndicator. `labels` on PageIndicator replaces them for
 * one indicator, each one on its own.
 */
export type PageIndicatorLabels = {
  /** The name of the group of pages: "Pages" by default. */
  group: string;
  /** The name of a page's button: "Page 1", "Page 2" and so on by default. */
  page: (page: number) => string;
};

/** The words a CodeBlock speaks to assistive technology. */
export type CodeBlockLabels = {
  /** Read in place of a masked value. */
  hidden: string;
  /** The reveal button while the value is masked. */
  reveal: string;
  /** The same button while the value shows. */
  hide: string;
  /** The copy button. */
  copy: string;
  /** The copy button while its check confirms a copy. */
  copied: string;
  /** The copy button and its announcement when the clipboard refuses. */
  copyFailed: string;
};

/** The accessible names of the controls in the Color Picker's popover. */
export type ColorPickerLabels = {
  /** The popover's dialog. */
  controls: string;
  /** The saturation and brightness area. */
  saturation: string;
  /** The hue slider. */
  hue: string;
  /** The hex value field. */
  hex: string;
  /** The copy button. */
  copy: string;
  /** The copy button while its check confirms a copy. */
  copied: string;
  /** The copy button and its announcement when the clipboard refuses. */
  copyFailed: string;
  /** The red, green and blue channel fields. */
  red: string;
  green: string;
  blue: string;
};

/** The words a CopyButton shows and speaks. */
export type CopyButtonLabels = {
  /** The name and the tooltip of a button that shows the icon alone. */
  copy: string;
  /**
   * The announcement while the check confirms a copy, and the name and the
   * tooltip of a button that shows the icon alone. A button with text keeps
   * its label.
   */
  copied: string;
  /**
   * The same for a copy that failed: the clipboard is missing or refuses, or
   * the value could not be read.
   */
  copyFailed: string;
};

/** The words of an Editable's triggers. */
export type EditableLabels = {
  /** The name of the edit trigger, which shows the pencil alone. */
  edit: string;
  /** The text of the submit trigger. */
  submit: string;
  /** The text of the cancel trigger. */
  cancel: string;
};

/** The words a File Upload shows and speaks. */
export type FileUploadLabels = {
  /** The link that opens the file dialog. */
  select: string;
  /** The text after it. */
  drop: string;
  /** The status of a file while it uploads. */
  uploading: string;
  /** The status of a file that has uploaded. */
  complete: string;
  /** The status of a file whose upload failed. */
  failed: string;
  /** The action that uploads a failed file again. */
  retry: string;
  /** The action that removes a file. */
  remove: string;
  /** The name of the list of files. */
  files: string;
  /** Why a file was not taken: its type is not accepted. */
  rejectedType: string;
  /** Why a file was not taken: it is larger than `maxSize`. */
  rejectedSize: string;
  /** Why a file was not taken: one file is allowed and more were given. */
  rejectedCount: string;
};

/** The words the Prompt Input speaks. Each can be replaced through `labels`. */
export type PromptInputLabels = {
  /** The name of the field for assistive technology. */
  textarea: string;
  /** The name of the button that sends the draft. */
  send: string;
  /** The name of the button that stops a reply that is running. */
  stop: string;
  /** The name and the tooltip of the button that picks files. */
  attach: string;
};

/** The words a Message Scroller shows and speaks. */
export type MessageScrollerLabels = {
  /** The name of the scrolling region. */
  region: string;
  /** The name of the button that scrolls to the latest message. */
  scrollToEnd: string;
  /** The name of the button that scrolls to the first message. */
  scrollToStart: string;
  /** Said once when a reply starts, not for each token. */
  responding: string;
  /** Said once when the reply is complete. */
  complete: string;
};

/** The words a TraceLink speaks to assistive technology. */
export type TraceLinkLabels = {
  /** Read after the title of a link that opens in a new tab. */
  newTab: string;
};

/**
 * The words that every chart gives screen readers. A chart's `labels`
 * replaces them for that chart. An empty text leaves its part out.
 */
export type ChartLabels = {
  /** What screen readers call the plot: its role description. "chart" by default. */
  roleDescription: string;
  /**
   * The hint read after the description of the plot while it is a focus stop:
   * how to move between its items. "Use the arrow keys to move between data
   * points." by default.
   */
  keyboardHint: string;
};

/**
 * The words of a Bar, Line or Area Chart: those of every chart, and the words of
 * the summary of its data that screen readers read, such as "Jan to Jun.
 * Desktop: lowest 73, highest 305."
 */
export type CartesianChartLabels = ChartLabels & {
  /** Joins the first and the last x value: "to" by default. */
  to: string;
  /** Comes before the lowest value of a series: "lowest" by default. */
  lowest: string;
  /** Comes before the highest value of a series: "highest" by default. */
  highest: string;
};

/**
 * The words of the Password Strength pattern. The level names are the status
 * line and the announcement; the rest name the show and hide action, the meter
 * and the requirement list, and tell whether a requirement is met.
 */
export type PasswordStrengthLabels = {
  /** The level of an empty field. */
  none: string;
  weak: string;
  medium: string;
  strong: string;
  /** Name of the action that hides the password again. */
  hide: string;
  /** Tells a screen reader that a requirement is met. */
  met: string;
  /** Ends the status line before the list of requirements. */
  mustContain: string;
  /** Tells a screen reader that a requirement is not met. */
  notMet: string;
  /** Name of the list of requirements. */
  requirements: string;
  /** Name of the action that shows the password. */
  show: string;
  /** Name of the meter. */
  strength: string;
};

/**
 * Every text of the kit, by component, each one required: the shape of the
 * English defaults and of a complete translation. An application passes a
 * partial one, `SiteplaneMessages`, to SiteplaneLocaleProvider.
 */
export type SiteplaneMessageCatalog = ModalBlockMessageGroups & {
  /**
   * Account Card, and the account menu that it shares with Header
   * Navigation's HeaderAccountMenu. The props of either replace each text for
   * one menu.
   */
  accountCard: {
    /** The name of the button that opens the account menu (`label`). */
    label: string;
    /** The label above the list of accounts (`accountsLabel`). */
    accounts: string;
    /** The row that adds an account (`addAccountLabel`). */
    addAccount: string;
    /** The row that signs out (`signOutLabel`). */
    signOut: string;
    /** The dark mode switch of HeaderAccountMenu (`darkModeLabel`). */
    darkMode: string;
  };
  /** Activity Feed. */
  activityFeed: {
    /** The name of the feed's list (`aria-label`). */
    label: string;
  };
  /** Animated Buttons. */
  animatedButtons: {
    /** The text of ExpandingArrowButton (`label`). */
    learnMore: string;
    /** The text of ExpandingLogoutButton (`label`). */
    logOut: string;
  };
  /** Autocomplete. */
  autocomplete: {
    /** The button that opens the suggestions (`triggerProps`). */
    showSuggestions: string;
    /** The button that clears the input (`clearProps`). */
    clear: string;
  };
  /** Avatar: the names of the status dot (`statusLabel`). */
  avatar: {
    away: string;
    busy: string;
    offline: string;
    online: string;
  };
  /** Avatar Group. */
  avatarGroup: {
    /** The name of AvatarGroupAddButton (`aria-label`). */
    add: string;
  };
  /** Breadcrumb. */
  breadcrumb: {
    /** The name of the navigation landmark (`aria-label`). */
    label: string;
    /** The hidden text of BreadcrumbEllipsis. */
    more: string;
  };
  /**
   * Calendar: also inside Date Field, Date Picker, Date Range Picker and Date
   * Time Picker, wherever the Calendar opens.
   */
  calendar: {
    /** The Today button of the Calendar's toolbar and of the Date Time Picker's footer. */
    today: string;
    /** The name of the date field in the Calendar's toolbar and in the Date Time Picker's footer. */
    date: string;
    /** The name of the list or row of shortcuts. */
    shortcuts: string;
    /** The name of the month and year picker. */
    monthYearPicker: string;
    /** The name of the heading button that opens it, with the month it shows. */
    monthYearButton: (month: string) => string;
    /** The arrow to the previous year, in the month view of the picker. */
    previousYear: string;
    /** The arrow to the previous years, in the year view of the picker. */
    previousYears: string;
    /** The arrow to the next year, in the month view of the picker. */
    nextYear: string;
    /** The arrow to the next years, in the year view of the picker. */
    nextYears: string;
  };
  /** Carousel; its role description is also Modal Block's media carousel's. */
  carousel: {
    /** What assistive technology calls the carousel: its role description. */
    label: string;
    /** What assistive technology calls a slide: its role description. */
    slide: string;
    /** The name of a slide: its place among the slides, counted from 1. */
    slidePosition: (position: number, count: number) => string;
    /** The name of CarouselPrevious. */
    previous: string;
    /** The name of CarouselNext. */
    next: string;
    /** The name of CarouselIndicator's group (`labels.group`). */
    slides: string;
    /** The name of a dot of CarouselIndicator (`labels.page`). */
    goToSlide: (slide: number) => string;
  };
  /**
   * Bar, Line, Area, Pie, Radar and Radial Bar Chart, and Bar List. A
   * chart's `labels` replaces a word for one chart, and its `emptyLabel` the
   * empty text. An empty text leaves its part out.
   */
  chart: CartesianChartLabels & {
    /** The text of a chart or a Bar List without data (`emptyLabel`). */
    noData: string;
  };
  /**
   * The remove action of a chip: a removable Badge, a Tag, a tag of Tags
   * Input and a chip of a multiple Combobox.
   */
  chip: {
    /**
     * The whole name of the remove action, with the chip's label, such as
     * "Remove Design"; the label is empty for a chip without text. Badge and
     * Tag `removeLabel`, Tags Input `removeLabel` and Combobox `removeProps`
     * replace it for one chip.
     */
    remove: (label: string) => string;
  };
  /**
   * CloseButton: the close of every overlay and card, a Dialog's, a Sheet's,
   * a Drawer's, a Popover's, an Alert's and a Featured Card's. `closeProps`,
   * `label` or `aria-label` replaces it for one close.
   */
  closeButton: {
    /** The name of the close button. */
    label: string;
  };
  /** Code Block (`labels`). */
  code: CodeBlockLabels;
  /** Color Picker (`labels`). */
  colorPicker: ColorPickerLabels & {
    /** The name of the button that opens the picker, with its color in hex (`aria-label`). */
    chooseColor: (color: string) => string;
  };
  /** Combobox. */
  combobox: {
    /** The button that opens the list (`triggerProps`). */
    showOptions: string;
    /** The button that clears the selection (`clearProps`). */
    clear: string;
    /**
     * The name of the search field in a popup, an embedded ComboboxInput
     * (`aria-label`).
     */
    search: string;
  };
  /** Command. */
  command: {
    /** The name of CommandDialogPopup (`aria-label`). */
    label: string;
    /** The name of CommandInput (`aria-label`). */
    search: string;
  };
  /** Copy Button (`labels`); its `copied` is also what the copy icon announces. */
  copyButton: CopyButtonLabels;
  /** Date Field. */
  dateField: {
    /** The name of the calendar in the field's popover. */
    calendar: string;
    /** The button that opens the calendar, also the Date Time Picker's (`openPickerLabel`). */
    openCalendar: string;
    /** The error of a required field with an incomplete date (`incompleteLabel`). */
    incompleteDate: string;
    /** The same with a time, also the Date Time Picker's (`incompleteLabel`). */
    incompleteDateTime: string;
  };
  /** Date Picker. */
  datePicker: {
    /** The name of the picker (`aria-label`). */
    label: string;
    /** The text of an empty picker, also the Date Time Picker's (`placeholder`). */
    placeholder: string;
    /** The Cancel button of the footer of Date Picker, Date Range Picker and Date Time Picker. */
    cancel: string;
    /** The Apply button of the same footer. */
    apply: string;
  };
  /** Date Range Picker. */
  dateRangePicker: {
    /** The text of an empty picker (`placeholder`). */
    placeholder: string;
    /** The button that opens the calendar (`openPickerLabel`). */
    openCalendar: string;
    /** The error of a required picker with an incomplete range (`incompleteLabel`). */
    incomplete: string;
    /** The name of the start date field in the footer (`startLabel`). */
    start: string;
    /** The name of the end date field in the footer (`endLabel`). */
    end: string;
  };
  /** Date Time Picker; its other texts are those of Calendar, Date Field and Date Picker. */
  dateTimePicker: {
    /** The name of the list of times beside the calendar. */
    times: string;
  };
  /** Editable (`labels`). */
  editable: EditableLabels;
  /** Featured Card. Its close is CloseButton's. */
  featuredCard: {
    /** The Dismiss link action (`dismissLabel`). */
    dismiss: string;
  };
  /** Field. */
  field: {
    /** The error of a control that is invalid without a message of its own. */
    invalid: string;
  };
  /** File Input. */
  fileInput: {
    /** The text of the button (`buttonText`). */
    button: string;
    /** The text while no file is chosen (`placeholder`). */
    placeholder: string;
  };
  /** File Type Icon. */
  fileTypeIcon: {
    /** The label on the icon of a file without a known short extension. */
    unknown: string;
  };
  /** File Upload (`labels`). */
  fileUpload: FileUploadLabels;
  /** Filter Bar. */
  filterBar: {
    /** The Search segment of FilterBarTabs (`searchLabel`). */
    search: string;
    /** The button that clears the search (`clearLabel`). */
    clear: string;
  };
  /** Header Navigation. */
  headerNavigation: {
    /** The name of the main navigation (`navigationLabel`). */
    navigation: string;
    /** The name of the phone menu (`menuLabel`). */
    menu: string;
    /** The button that closes the phone menu (`closeLabel`). */
    close: string;
    /** The name of the second row of links (`subNavigationLabel`). */
    secondaryNavigation: string;
  };
  /** MenuIconMorph (`aria-label`). */
  iconMorphs: {
    /** The name of the closed menu button. */
    open: string;
    /** The name of the open menu button. */
    close: string;
  };
  /** Input Group. */
  inputGroup: {
    /** The help button of InputGroupTooltip and of a field label's `tooltip` (`aria-label`). */
    help: string;
  };
  /** LoadingButton. */
  loadingButton: {
    /** The text while the action runs (`loadingText`). */
    loading: string;
  };
  /** Menu. */
  menu: {
    /** The name of MenuSearch's field (`aria-label`). */
    searchLabel: string;
    /** The text of MenuSearch's empty field (`placeholder`). */
    searchPlaceholder: string;
  };
  /** Message Scroller (`labels`). */
  messageScroller: MessageScrollerLabels;
  /** Metric Card. */
  metricCard: {
    /** The button that opens the card's menu (`menuLabel`). */
    menu: string;
  };
  /** Notification. */
  notification: {
    /** The name of the dismiss button, with the notification's title (`dismissLabel`). */
    dismiss: (title: string) => string;
    /** The name of NotificationList (`aria-label`). */
    list: string;
  };
  /** Number Field. */
  numberField: {
    /** The name of NumberFieldIncrement (`aria-label`). */
    increase: string;
    /** The name of NumberFieldDecrement (`aria-label`). */
    decrease: string;
  };
  /** Page Header. */
  pageHeader: {
    /** The first crumb of PageHeaderBreadcrumbs (`homeLabel`). */
    home: string;
    /** The back link on a phone (`backLabel`). */
    back: string;
    /** The button that shows every level (`expandLabel`). */
    expand: string;
  };
  /** Page Indicator (`labels`). */
  pageIndicator: PageIndicatorLabels;
  /** Pagination (`labels`). */
  pagination: PaginationLabels;
  /** Password Strength (`labels`, `label` and `requirements`). */
  passwordStrength: PasswordStrengthLabels & {
    /** The label of the field (`label`). */
    label: string;
    /** The default requirement of eight characters. */
    length: string;
    /** The default requirement of a number. */
    number: string;
    /** The default requirement of a lowercase letter. */
    lowercase: string;
    /** The default requirement of an uppercase letter. */
    uppercase: string;
  };
  /** Prompt Input (`labels`). */
  promptInput: PromptInputLabels;
  /** Sidebar. */
  sidebar: {
    /** The close button of the sidebar on a phone (`closeLabel`). */
    close: string;
    /** The hidden title of the sidebar on a phone (`aria-label`). */
    title: string;
    /** The name of SidebarTrigger and SidebarRail. */
    toggle: string;
    /** The tooltip of a resizable SidebarRail. */
    resize: string;
    /** The expand trigger of SidebarMenuItem (`expandLabel`). */
    expand: string;
  };
  /** Social Button. */
  socialButton: {
    /** The name of a button with the logo alone, with the provider (`aria-label`). */
    signIn: (provider: string) => string;
  };
  /** Spinner. */
  spinner: {
    /** The name of a spinner without a caption (`aria-label`). */
    label: string;
  };
  /** Stepper: the hidden status after the title of a step (`statusLabel`). */
  stepper: {
    done: string;
    blocked: string;
  };
  /** Store Button: the caption over the store's name, the store's own wording. */
  storeButton: {
    appGallery: string;
    appStore: string;
    galaxyStore: string;
    googlePlay: string;
  };
  /** Tags Input. */
  tagsInput: {
    /** The name of the tags without a Field label (`aria-label`). */
    label: string;
  };
  /** Task Calendar. */
  taskCalendar: {
    /** The name of the calendar (`aria-label`). */
    label: string;
    /** The arrow to the previous week. */
    previousWeek: string;
    /** The arrow to the next week. */
    nextWeek: string;
    /** The number of weeks under the range. */
    weekCount: (count: number) => string;
    /** The arrow to the previous day in the day dialog. */
    previousDay: string;
    /** The arrow to the next day in the day dialog. */
    nextDay: string;
    /** A number of tasks, which the texts below with `tasks` take. */
    taskCount: (count: number) => string;
    /** The title of the day dialog while no task is selected. */
    noTaskSelected: string;
    /** The text under it. */
    selectTask: string;
    /** The text of a task without a description. */
    noDescription: string;
    /** The title of the empty detail area. */
    detailArea: string;
    /** The text under it. */
    noDetailContent: string;
    /** The close of the day dialog. */
    closeDialog: string;
    /** The meta of a task without an assignee or a status. */
    details: string;
    /** The text of a day without tasks in the day dialog. */
    noTasksOnDay: string;
    /** The description of a day's task list, with its number of tasks. */
    detailListCount: (tasks: string) => string;
    /** The same for a day without tasks. */
    noTasksInDetailList: string;
    /** The text of an empty task list. */
    noDayDetails: string;
    /** The description of a task's popover. */
    taskDetailsDescription: string;
    /** The button in a task's popover that opens the day dialog. */
    openInDayDetails: string;
    /** The name of a day, with its date and its number of tasks. */
    openDayDetails: (day: string, tasks: string) => string;
    /** The name of a day's task count button, with its date and its number of tasks. */
    showTaskList: (day: string, tasks: string) => string;
    /** The name of a task, with its title. */
    openTaskDetails: (title: string) => string;
  };
  /** Theme Toggles: SunMoonMorphToggle and LayeredThemeToggle. */
  themeToggles: {
    /** The name of the toggle (`aria-label`). */
    darkMode: string;
  };
  /** Time Field: its texts are also the Date Time Picker's. */
  timeField: {
    /** The column of hours in the time selector (`hoursLabel`). */
    hours: string;
    /** The column of minutes in the time selector (`minutesLabel`). */
    minutes: string;
    /** The button that opens the time selector (`openPickerLabel`). */
    openSelector: string;
    /** The error of a required field with an incomplete time (`incompleteLabel`). */
    incomplete: string;
    /** The name of the hour segment of a field named by `aria-label`, with that name (`hourLabel`). */
    hourSegment: (label: string) => string;
    /** The same for the minute segment (`minuteLabel`). */
    minuteSegment: (label: string) => string;
    /** The same for the AM and PM segment of a 12-hour field. */
    dayPeriodSegment: (label: string) => string;
  };
  /** Timeline. */
  timeline: {
    /** The label of TimelineNow (`label`). */
    now: string;
  };
  /** Toast. */
  toast: {
    /** The name of each toast's dismiss button (ToastProvider `dismissLabel`). */
    dismiss: string;
    /** The name of the region the toasts appear in. */
    region: string;
  };
  /** Trace (TraceLink `labels`). */
  trace: TraceLinkLabels;
};

/**
 * The kit's texts that an application changes: each group, and each text in
 * a group, is optional, and every text left out keeps its English default.
 * Write a translation with `satisfies SiteplaneMessages`, so a mistyped key
 * or a text of the wrong kind is an error.
 */
export type SiteplaneMessages = {
  [Group in keyof SiteplaneMessageCatalog]?:
    | {
        [Key in keyof SiteplaneMessageCatalog[Group]]?:
          SiteplaneMessageCatalog[Group][Key] | undefined;
      }
    | undefined;
};

const taskCount = (count: number) =>
  count === 1 ? "1 task" : `${count} tasks`;

/** The English of every text, the kit's default. */
export const englishMessages: SiteplaneMessageCatalog = {
  ...englishModalBlockMessages,
  accountCard: {
    accounts: "Switch account",
    addAccount: "Add account",
    darkMode: "Dark mode",
    label: "Account menu",
    signOut: "Sign out",
  },
  activityFeed: { label: "Activity feed" },
  animatedButtons: { learnMore: "Learn more", logOut: "Log out" },
  autocomplete: { clear: "Clear input", showSuggestions: "Show suggestions" },
  avatar: { away: "Away", busy: "Busy", offline: "Offline", online: "Online" },
  avatarGroup: { add: "Add user" },
  breadcrumb: { label: "breadcrumb", more: "More" },
  calendar: {
    date: "Date",
    monthYearButton: (month) => `Choose month and year, ${month}`,
    monthYearPicker: "Choose month and year",
    nextYear: "Next year",
    nextYears: "Next years",
    previousYear: "Previous year",
    previousYears: "Previous years",
    shortcuts: "Shortcuts",
    today: "Today",
  },
  carousel: {
    goToSlide: (slide) => `Go to slide ${slide}`,
    label: "carousel",
    next: "Next slide",
    previous: "Previous slide",
    slide: "slide",
    slidePosition: (position, count) => `${position} of ${count}`,
    slides: "Slides",
  },
  chart: {
    highest: "highest",
    keyboardHint: "Use the arrow keys to move between data points.",
    lowest: "lowest",
    noData: "No data",
    roleDescription: "chart",
    to: "to",
  },
  chip: { remove: (label) => (label ? `Remove ${label}` : "Remove") },
  closeButton: { label: "Close" },
  code: {
    copied: "Copied to clipboard",
    copy: "Copy to clipboard",
    copyFailed: "Copy unavailable",
    hidden: "Hidden value",
    hide: "Hide value",
    reveal: "Reveal value",
  },
  colorPicker: {
    blue: "B color channel",
    chooseColor: (color) => `Choose color ${color}`,
    controls: "Color controls",
    copied: "Copied hex value",
    copy: "Copy hex value",
    copyFailed: "Copy unavailable",
    green: "G color channel",
    hex: "Hex color value",
    hue: "Color hue",
    red: "R color channel",
    saturation: "Color saturation and brightness",
  },
  combobox: {
    clear: "Clear selection",
    search: "Search",
    showOptions: "Show options",
  },
  command: { label: "Command palette", search: "Search commands" },
  copyButton: {
    copied: "Copied",
    copy: "Copy",
    copyFailed: "Copy unavailable",
  },
  dateField: {
    calendar: "Choose date",
    incompleteDate: "Enter a complete date.",
    incompleteDateTime: "Enter a complete date and time.",
    openCalendar: "Open date calendar",
  },
  datePicker: {
    apply: "Apply",
    cancel: "Cancel",
    label: "Choose date",
    placeholder: "Choose date",
  },
  dateRangePicker: {
    end: "End date",
    incomplete: "Enter a complete date range.",
    openCalendar: "Open date range calendar",
    placeholder: "Choose dates",
    start: "Start date",
  },
  dateTimePicker: { times: "Available times" },
  editable: { cancel: "Cancel", edit: "Edit", submit: "Save" },
  featuredCard: { dismiss: "Dismiss" },
  field: { invalid: "Invalid value." },
  fileInput: { button: "Upload", placeholder: "Choose a file" },
  fileTypeIcon: { unknown: "FILE" },
  fileUpload: {
    complete: "Complete",
    drop: "or drag and drop",
    failed: "Upload failed",
    files: "Files",
    rejectedCount: "Only one file can be uploaded",
    rejectedSize: "File exceeds size limit",
    rejectedType: "File type not accepted",
    remove: "Remove",
    retry: "Try again",
    select: "Click to upload",
    uploading: "Uploading…",
  },
  filterBar: { clear: "Clear search", search: "Search" },
  headerNavigation: {
    close: "Close navigation",
    menu: "Navigation",
    navigation: "Main navigation",
    secondaryNavigation: "Secondary navigation",
  },
  iconMorphs: { close: "Close navigation menu", open: "Open navigation menu" },
  inputGroup: { help: "More information" },
  loadingButton: { loading: "Saving" },
  menu: { searchLabel: "Search", searchPlaceholder: "Search" },
  messageScroller: {
    complete: "Response complete",
    region: "Messages",
    responding: "Assistant is responding",
    scrollToEnd: "Scroll to latest",
    scrollToStart: "Scroll to first",
  },
  metricCard: { menu: "Open menu" },
  notification: {
    dismiss: (title) => `Dismiss ${title}`,
    list: "Notifications",
  },
  numberField: { decrease: "Decrease", increase: "Increase" },
  pageHeader: { back: "Back", expand: "Show all levels", home: "Home" },
  pageIndicator: { group: "Pages", page: (page) => `Page ${page}` },
  pagination: {
    morePages: "More pages",
    navigation: "pagination",
    next: "Next",
    nextPage: "Go to next page",
    pageStatus: "Page {page} of {total}",
    previous: "Previous",
    previousPage: "Go to previous page",
  },
  passwordStrength: {
    hide: "Hide password",
    label: "Password",
    length: "At least 8 characters",
    lowercase: "At least 1 lowercase letter",
    medium: "Medium password",
    met: "Requirement met",
    mustContain: "Must contain:",
    none: "Enter a password",
    notMet: "Requirement not met",
    number: "At least 1 number",
    requirements: "Password requirements",
    show: "Show password",
    strength: "Password strength",
    strong: "Strong password",
    uppercase: "At least 1 uppercase letter",
    weak: "Weak password",
  },
  promptInput: {
    attach: "Attach files",
    send: "Send message",
    stop: "Stop",
    textarea: "Message",
  },
  sidebar: {
    close: "Close sidebar",
    expand: "Expand sidebar",
    resize: "Resize or toggle sidebar",
    title: "Sidebar",
    toggle: "Toggle sidebar",
  },
  socialButton: { signIn: (provider) => `Sign in with ${provider}` },
  spinner: { label: "Loading" },
  stepper: { blocked: "blocked", done: "completed" },
  storeButton: {
    appGallery: "Explore it on",
    appStore: "Download on the",
    galaxyStore: "Available on",
    googlePlay: "Get it on",
  },
  tagsInput: { label: "Tags" },
  taskCalendar: {
    closeDialog: "Close dialog",
    detailArea: "Detail area",
    detailListCount: (tasks) => `${tasks} in the detail list.`,
    details: "Details",
    label: "Task calendar",
    nextDay: "Show next day",
    nextWeek: "Show next week",
    noDayDetails: "No day details available.",
    noDescription: "No description has been added for this task.",
    noDetailContent: "No detail content has been added yet.",
    noTaskSelected: "No task selected",
    noTasksInDetailList: "No tasks in the detail list.",
    noTasksOnDay: "No tasks on this day.",
    openDayDetails: (day, tasks) =>
      `Open calendar details for ${day}, ${tasks}`,
    openInDayDetails: "Open in day details",
    openTaskDetails: (title) => `Open details for task ${title}`,
    previousDay: "Show previous day",
    previousWeek: "Show previous week",
    selectTask: "Select a task from the list to view its details.",
    showTaskList: (day, tasks) => `Show task list for ${day}, ${tasks}`,
    taskCount,
    taskDetailsDescription: "Task details and next steps.",
    weekCount: (count) => (count === 1 ? "1 week" : `${count} weeks`),
  },
  themeToggles: { darkMode: "Dark mode" },
  timeField: {
    dayPeriodSegment: (label) => `${label}, AM/PM`,
    hourSegment: (label) => `${label}, hour`,
    hours: "Hours",
    incomplete: "Enter a complete time.",
    minuteSegment: (label) => `${label}, minute`,
    minutes: "Minutes",
    openSelector: "Open time selector",
  },
  timeline: { now: "Now" },
  toast: { dismiss: "Dismiss toast", region: "Notifications" },
  trace: { newTab: "(opens in a new tab)" },
};

/**
 * `messages` over `base`: each group of `messages` merged into the same group
 * of `base`. A text that is undefined keeps the one of `base`, and a group or
 * a text the catalog does not have is left out, so messages written for
 * another version of the kit do no harm.
 */
export function mergeSiteplaneMessages(
  base: SiteplaneMessageCatalog,
  messages: SiteplaneMessages | undefined,
): SiteplaneMessageCatalog {
  if (!messages) return base;
  const merged: Record<string, Record<string, unknown>> = { ...base };
  for (const [group, texts] of Object.entries(messages)) {
    const current = merged[group];
    if (!texts || !current) continue;
    const next = { ...current };
    for (const [key, text] of Object.entries(texts))
      if (text !== undefined && key in next) next[key] = text;
    merged[group] = next;
  }
  return merged as SiteplaneMessageCatalog;
}

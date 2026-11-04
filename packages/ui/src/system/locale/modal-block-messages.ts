/**
 * The texts of the Modal Block pattern and its parts, a part of the kit's
 * message catalog (messages.ts) kept in a file of its own for its size. The
 * labels types of the parts live here as well, so a part and its group of
 * the catalog share one owner; the parts re-export them.
 */

/** The words of a ModalPasswordField's show/hide toggle. */
export type ModalPasswordFieldLabels = {
  /** Accessible name of the toggle while the value is shown. */
  hide: string;
  /** Accessible name of the toggle while the value is masked. */
  show: string;
};

/** The words of the appearance settings; pass the ones to translate. */
export type ModalAppearanceLabels = {
  brand: string;
  custom: string;
  customHex: string;
  dark: string;
  display: string;
  light: string;
  system: string;
};

/**
 * The words of the editor's toolbar and link panel; pass the ones to
 * translate. `formatting` names the toolbar with the editor's own label.
 */
export type ModalTextEditorLabels = {
  addLink: string;
  bold: string;
  bulletList: string;
  centerAlign: string;
  /** The names of the text colors, from slate to pink. */
  colorBlue: string;
  colorGreen: string;
  colorOrange: string;
  colorPink: string;
  colorRed: string;
  colorSlate: string;
  colorTeal: string;
  colorViolet: string;
  editLink: string;
  fontFamily: string;
  fontMono: string;
  fontSans: string;
  fontSerif: string;
  /**
   * The name of the toolbar, with the editor's label, such as "Description
   * formatting". A word, as in 1.x, follows the label instead.
   */
  formatting: string | ((label: string) => string);
  generate: string;
  imageFile: string;
  insert: string;
  insertImage: string;
  /** Tells that the address of a link is not valid. */
  invalidLink: string;
  italic: string;
  leftAlign: string;
  link: string;
  linkUrl: string;
  paragraph: string;
  removeLink: string;
  text: string;
  textColor: string;
  underline: string;
  updateLink: string;
};

/** The words of the experience fields; pass the ones to translate. */
export type ModalExperienceLabels = {
  company: string;
  description: string;
  /** The help beside the description label. */
  descriptionHelp: string;
  employment: string;
  location: string;
  role: string;
  title: string;
  website: string;
};

/** The words of the company fields; pass the ones to translate. */
export type ModalCompanyLabels = {
  companyName: string;
  description: string;
  keywords: string;
  profileImage: string;
  username: string;
  websiteUrl: string;
};

/** The words of the user settings; pass the ones to translate. */
export type ModalUserSettingsLabels = {
  archive: string;
  country: string;
  edit: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  /** The name of the badge beside a verified user's name. */
  verified: string;
};

/** The words of the event details; pass the ones to translate. */
export type ModalEventDetailsLabels = {
  /** The name of the button that adds a guest. */
  addGuest: string;
  attendees: string;
  details: string;
  organizer: string;
};

/** The words of the event fields; pass the ones to translate. */
export type ModalEventFieldsLabels = {
  description: string;
  /** The name of the calendar. */
  eventDates: string;
  endTime: string;
  location: string;
  locationPlaceholder: string;
  startTime: string;
  title: string;
};

/** The words of the assistant; pass the ones to translate. */
export type ModalAssistantLabels = {
  /** The label of the button that picks files to attach. */
  attach: string;
  /** The name of the hidden file input. */
  attachFiles: string;
  /** The name of the dictation button. */
  dictate: string;
  /** The name of the message field. */
  message: string;
  /** The last prompt chip, which shows more prompts. */
  more: string;
  placeholder: string;
  shortcuts: string;
  /** The heading of the menu that switches between users. */
  switchAccount: string;
};

/** The words of the message composer; pass the ones to translate. */
export type ModalMessageLabels = {
  /** The name of the button that picks files to attach. */
  attach: string;
  /** The name of the hidden file input. */
  attachFiles: string;
  cc: string;
  /** The name of the button that discards the draft. */
  discard: string;
  /** The name of the message field. */
  message: string;
  /** Starts the name of the button that removes an attachment, before its file name. */
  remove: string;
  /** The name of the button that saves the draft. */
  save: string;
  /** The name of the button that schedules the message. */
  schedule: string;
  /** The text of the button that sends the message later. */
  sendLater: string;
  subject: string;
  /** The name of the button that inserts a snippet. */
  snippet: string;
  to: string;
};

/** The groups of Modal Block's texts, by part. */
export type ModalBlockMessageGroups = {
  /** ModalAppearance (`labels`). */
  modalAppearance: ModalAppearanceLabels;
  /** ModalAssistant (`labels`). */
  modalAssistant: ModalAssistantLabels;
  /** ModalAuthFields. Its other words are its `labels`, which it requires. */
  modalAuthFields: {
    /** The word between the form and the social actions (`labels.divider`). */
    divider: string;
  };
  /** ModalBannerAppearance. */
  modalBannerAppearance: {
    /** The name of the group of banner choices (`label`). */
    label: string;
    /** The action over the Custom preview that edits its CSS. */
    editCss: string;
  };
  /** ModalBlock. Its close is CloseButton's (`closeLabel`). */
  modalBlock: {
    /** The text of the button that opens the dialog (`trigger`). */
    trigger: string;
    /** The text of the confirm button (`confirmLabel`). */
    confirm: string;
    /** The text of the button that closes the dialog without confirming (`cancelLabel`). */
    cancel: string;
  };
  /** ModalCompanyFields (`labels`). */
  modalCompany: ModalCompanyLabels;
  /** ModalCopyLink. A copy that fails says CopyButton's `copyFailed` (`failedLabel`). */
  modalCopyLink: {
    /** The text of the action (`label`). */
    label: string;
    /** Announced once the link is on the clipboard (`copiedLabel`). */
    copied: string;
  };
  /** ModalDateRangeFields: the calendar and the date fields below it. */
  modalDateRangeFields: {
    /** The name of the calendar (`label`). */
    label: string;
    /** The label of the start date field (`startLabel`). */
    start: string;
    /** The label of the end date field (`endLabel`). */
    end: string;
  };
  /** ModalDateRangeInputs: the range field for a dialog footer. */
  modalDateRangeInputs: {
    /** The name of the range field (`label`). */
    label: string;
    /** The name of its start date (`startLabel`). */
    start: string;
    /** The name of its end date (`endLabel`). */
    end: string;
  };
  /** ModalEventDetails (`labels`). */
  modalEventDetails: ModalEventDetailsLabels;
  /** ModalEventFields (`labels`). */
  modalEventFields: ModalEventFieldsLabels;
  /** ModalExperienceFields (`labels`). */
  modalExperience: ModalExperienceLabels;
  /**
   * ModalFieldError: the message under a field of the parts whose value is not
   * valid, with the field's label. A custom error of the field replaces it.
   */
  modalFieldError: {
    /** A required field that is empty. */
    required: (label: string) => string;
    /** A value shorter than the field's `minLength`, with that length. */
    minLength: (label: string, minLength: number) => string;
    /** A value that is too short, in a field that names no `minLength`. */
    tooShort: (label: string) => string;
    /** Any other value that is not valid, such as an email address without an @. */
    invalid: (label: string) => string;
  };
  /** ModalFieldFrame: the label of a modal field, such as ModalTextField's. */
  modalFieldFrame: {
    /** The name of the help icon that `help` adds beside the label, with the label. */
    help: (label: string) => string;
  };
  /** ModalImageCrop. */
  modalImageCrop: {
    /** The name of the group of image choices (`imagesLabel`). */
    images: string;
    /** The name of the upload button and of an uploaded image (`uploadLabel`). */
    upload: string;
    /** The name of the area that moves the crop (`moveLabel`). */
    move: string;
    /** Starts the name of each corner handle, before its corner (`resizeLabel`). */
    resize: string;
    /** The corner of a handle, after `resize`. */
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
  /** ModalInviteEmails. */
  modalInviteEmails: {
    /**
     * The name of the action that removes an added field, with its address,
     * or the field's label and number while it is empty. A `removeLabel`
     * starts the name instead, before the address.
     */
    remove: (address: string) => string;
  };
  /** ModalLinkField. */
  modalLinkField: {
    /** The name of the copy action (`copyLabel`). */
    copy: string;
    /** Announced once the link is on the clipboard (`copiedLabel`). */
    copied: string;
    /** Announced and shown under the field when the clipboard is missing or refuses. */
    copyFailed: string;
  };
  /** ModalMediaCarousel (`labels`). Its role description is Carousel's. */
  modalMediaCarousel: {
    /** The button back to the previous slide (`labels.previous`). */
    previous: string;
    /** The button on to the next slide (`labels.next`). */
    next: string;
    /** The button on the last slide that ends the tour (`labels.finish`). */
    finish: string;
    /** The button on the first slide that skips the tour (`labels.skip`). */
    skip: string;
    /** The name of the Play button over a video (`labels.play`). */
    play: string;
  };
  /** ModalMemberPicker. Its remove action is ModalPeople's (`removeLabel`). */
  modalMemberPicker: {
    /** The name and the placeholder of the select that adds a person (`label`). */
    label: string;
  };
  /** ModalMessage (`labels`). */
  modalMessage: ModalMessageLabels & {
    /** The text of the button that sends the message (`sendLabel`). */
    send: string;
  };
  /** ModalPasswordField (`labels`). */
  modalPasswordField: ModalPasswordFieldLabels;
  /** ModalPaymentFields (`labels`). */
  modalPaymentFields: {
    /** The label of the cardholder field (`labels.name`). */
    name: string;
    /** The label of the expiry field (`labels.expiry`). */
    expiry: string;
    /** The placeholder of the expiry field, which shows the order of month and year. */
    expiryPlaceholder: string;
    /** The label of the card number field (`labels.number`). */
    number: string;
    /** The label of the security code field (`labels.security`). */
    security: string;
    /** The name of the toggle that shows the security code, with its label (`labels.showSecurity`). */
    showSecurity: (label: string) => string;
    /** The name of the same toggle while the code shows (`labels.hideSecurity`). */
    hideSecurity: (label: string) => string;
  };
  /** ModalPaymentMethods (`labels`). */
  modalPaymentMethods: {
    /** The name of the group of payment methods (`labels.group`). */
    group: string;
    /** The action that edits a method (`labels.edit`). */
    edit: string;
    /** The action that makes a method the default one (`labels.setDefault`). */
    setDefault: string;
  };
  /** ModalPeople. */
  modalPeople: {
    /** The text of the action that removes a person (`removeLabel`). */
    remove: string;
    /**
     * Its name, with the person's name. A `removeLabel` starts the name
     * instead, before the person's name.
     */
    removePerson: (name: string) => string;
  };
  /** ModalPlanPicker. */
  modalPlanPicker: {
    /** The name of the group of plans (`label`). */
    label: string;
  };
  /** ModalProfileFields (`labels`). */
  modalProfileFields: {
    /** The label of the username field (`labels.username`). */
    username: string;
    /** The label of the introduction field (`labels.intro`). */
    intro: string;
    /** The label of the terms checkbox (`labels.terms`). */
    terms: string;
    /** The words of `terms` that link to the terms at `termsHref` (`labels.termsLink`). */
    termsLink: string;
    /** The error of the terms checkbox while it is not checked. */
    termsRequired: string;
  };
  /** ModalProjectFields (`labels`). */
  modalProjectFields: {
    /** The label of the project name field (`labels.name`). */
    name: string;
    /** The label of the team select (`labels.team`). */
    team: string;
    /** The label of the tags field (`labels.tags`). */
    tags: string;
  };
  /** ModalSeats. */
  modalSeats: {
    /** The name of the seat count (`label`). */
    label: string;
    /** The term of the price of one seat (`priceLabel`). */
    price: string;
    /** The term of the total price (`totalLabel`). */
    total: string;
  };
  /** ModalShare. */
  modalShare: {
    /** The name and the placeholder of the search field (`searchLabel`). */
    search: string;
    /** Starts the link's permission select, before the permission (`linkLabel`). */
    link: string;
    /** The name of the copy button (`copyLabel`). */
    copy: string;
    /** Announced once the link is copied (`copiedLabel`). */
    copied: string;
    /** Announced and shown when the clipboard is missing or refuses (`failedLabel`). */
    copyFailed: string;
    /** The heading over the list of people (`accessLabel`). */
    access: string;
    /** The line under that heading (`accessHint`). */
    accessHint: string;
    /** Starts the name of each person's permission select, before the name (`permissionLabel`). */
    permission: string;
  };
  /** ModalTextEditor (`labels`). */
  modalTextEditor: ModalTextEditorLabels;
  /** ModalUpload. The words of the File Upload inside are File Upload's. */
  modalUpload: {
    /** The hint in the dropzone (`description`). */
    description: string;
  };
  /** ModalUserSettings (`labels`). */
  modalUserSettings: ModalUserSettingsLabels;
};

/** The English of Modal Block's texts. */
export const englishModalBlockMessages: ModalBlockMessageGroups = {
  modalAppearance: {
    brand: "Brand color",
    custom: "Custom",
    customHex: "Custom color hex value",
    dark: "Dark",
    display: "Display preference",
    light: "Light",
    system: "System preference",
  },
  modalAssistant: {
    attach: "Attach",
    attachFiles: "Attach files",
    dictate: "Dictate",
    message: "Message",
    more: "More",
    placeholder: "Ask me anything…",
    shortcuts: "Shortcuts",
    switchAccount: "Switch account",
  },
  modalAuthFields: { divider: "OR" },
  modalBannerAppearance: { editCss: "Edit CSS", label: "Banner appearance" },
  modalBlock: { cancel: "Cancel", confirm: "Confirm", trigger: "Open dialog" },
  modalCompany: {
    companyName: "Company name",
    description: "Description",
    keywords: "Keywords",
    profileImage: "Profile image",
    username: "Username",
    websiteUrl: "Website URL",
  },
  modalCopyLink: { copied: "Link copied", label: "Copy link" },
  modalDateRangeFields: {
    end: "End date",
    label: "Date range",
    start: "Start date",
  },
  modalDateRangeInputs: {
    end: "End date",
    label: "Date range",
    start: "Start date",
  },
  modalEventDetails: {
    addGuest: "Add guest",
    attendees: "Attendees",
    details: "Details",
    organizer: "Organizer",
  },
  modalEventFields: {
    description: "Description",
    endTime: "End time",
    eventDates: "Event dates",
    location: "Location",
    locationPlaceholder: "Add location",
    startTime: "Start time",
    title: "Title",
  },
  modalExperience: {
    company: "Company",
    description: "Description",
    descriptionHelp:
      "Describe what you worked on and what you achieved in this role.",
    employment: "Employment",
    location: "Location",
    role: "Role",
    title: "Title",
    website: "Website",
  },
  modalFieldError: {
    invalid: (label) => `Enter a valid ${label.toLowerCase()}.`,
    minLength: (label, minLength) =>
      `${label} must be at least ${minLength} characters.`,
    required: (label) => `${label} is required.`,
    tooShort: (label) => `${label} is too short.`,
  },
  modalFieldFrame: { help: (label) => `${label} help` },
  modalImageCrop: {
    bottomLeft: "bottom left",
    bottomRight: "bottom right",
    images: "Images",
    move: "Move crop with arrow keys",
    resize: "Resize crop",
    topLeft: "top left",
    topRight: "top right",
    upload: "Upload image",
  },
  modalInviteEmails: { remove: (address) => `Remove ${address}` },
  modalLinkField: {
    copied: "Link copied",
    copy: "Copy link",
    copyFailed: "Copy unavailable. Select and copy the link.",
  },
  modalMediaCarousel: {
    finish: "Continue",
    next: "Next",
    play: "Play video",
    previous: "Back",
    skip: "Skip",
  },
  modalMemberPicker: { label: "Team member" },
  modalMessage: {
    attach: "Attach",
    attachFiles: "Attach files",
    cc: "Cc",
    discard: "Discard",
    message: "Message",
    remove: "Remove",
    save: "Save",
    schedule: "Schedule",
    send: "Send",
    sendLater: "Send later",
    snippet: "Use snippet",
    subject: "Subject",
    to: "To",
  },
  modalPasswordField: { hide: "Hide password", show: "Show password" },
  modalPaymentFields: {
    expiry: "Expiry",
    expiryPlaceholder: "MM/YY",
    hideSecurity: (label) => `Hide ${label}`,
    name: "Name on card",
    number: "Card number",
    security: "CVV",
    showSecurity: (label) => `Show ${label}`,
  },
  modalPaymentMethods: {
    edit: "Edit",
    group: "Payment method",
    setDefault: "Set as default",
  },
  modalPeople: {
    remove: "Remove",
    removePerson: (name) => `Remove ${name}`,
  },
  modalPlanPicker: { label: "Plan" },
  modalProfileFields: {
    intro: "Introduction",
    terms: "I agree with the terms and conditions",
    termsLink: "terms and conditions",
    termsRequired: "Accept the terms to continue.",
    username: "Username",
  },
  modalProjectFields: { name: "Project name", tags: "Tags", team: "Team" },
  modalSeats: { label: "Seats", price: "Price per seat", total: "Total" },
  modalShare: {
    access: "Who has access",
    accessHint: "Invite others to view and edit this project.",
    copied: "Link copied",
    copy: "Copy link",
    copyFailed: "Copy unavailable. Select and copy the link.",
    link: "Anyone with the link",
    permission: "Permission for",
    search: "Search by name or email",
  },
  modalTextEditor: {
    addLink: "Add link",
    bold: "Bold",
    bulletList: "Bullet list",
    centerAlign: "Center align",
    colorBlue: "Blue",
    colorGreen: "Green",
    colorOrange: "Orange",
    colorPink: "Pink",
    colorRed: "Red",
    colorSlate: "Slate",
    colorTeal: "Teal",
    colorViolet: "Violet",
    editLink: "Edit link",
    fontFamily: "Font family",
    fontMono: "Mono",
    fontSans: "Sans",
    fontSerif: "Serif",
    formatting: (label) => `${label} formatting`,
    generate: "Generate",
    imageFile: "Image file",
    insert: "Insert",
    insertImage: "Insert image",
    invalidLink: "Enter a link that starts with https://, http:// or mailto:.",
    italic: "Italic",
    leftAlign: "Left align",
    link: "Link",
    linkUrl: "Link URL",
    paragraph: "Paragraph",
    removeLink: "Remove link",
    text: "Text",
    textColor: "Text color",
    underline: "Underline",
    updateLink: "Update link",
  },
  modalUpload: { description: "Choose files or drop them here." },
  modalUserSettings: {
    archive: "Archive",
    country: "Country",
    edit: "Edit",
    email: "Email",
    firstName: "First name",
    lastName: "Last name",
    name: "Name",
    username: "Username",
    verified: "Verified",
  },
};

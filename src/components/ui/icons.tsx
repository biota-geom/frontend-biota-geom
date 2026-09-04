// Decorative SVG icons shared across pages/components. Excluded from
// mutation testing (see stryker.conf.json): they render fixed markup with
// no behavior, so mutating path/attribute values would only ever produce
// meaningless "survived" noise, not real test gaps.

export function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.75 17.25C14.34 17.25 17.25 14.34 17.25 10.75C17.25 7.16 14.34 4.25 10.75 4.25C7.16 4.25 4.25 7.16 4.25 10.75C4.25 14.34 7.16 17.25 10.75 17.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M15.5 15.5L20 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="17"
      viewBox="0 0 24 24"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 19H9L18.25 9.75L14.25 5.75L5 15V19Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M13.25 6.75L17.25 10.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="17"
      viewBox="0 0 24 24"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.75 7.75H17.25M10 10.75V16.25M14 10.75V16.25M9.25 7.75L9.75 5.25H14.25L14.75 7.75M8.25 7.75L8.75 19.25H15.25L15.75 7.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.75 6.75H19.25V17.25H4.75V6.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5.5 7.5L12 12.25L18.5 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.75 10.25V8.5C7.75 6.15 9.35 4.75 12 4.75C14.65 4.75 16.25 6.15 16.25 8.5V10.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M6.75 10.25H17.25V18.25H6.75V10.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.75 12C6.2 8.95 8.65 7.25 12 7.25C15.35 7.25 17.8 8.95 19.25 12C17.8 15.05 15.35 16.75 12 16.75C8.65 16.75 6.2 15.05 4.75 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 14.25C13.24 14.25 14.25 13.24 14.25 12C14.25 10.76 13.24 9.75 12 9.75C10.76 9.75 9.75 10.76 9.75 12C9.75 13.24 10.76 14.25 12 14.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BuildingIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 20.25V4.75H17V20.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M4.75 20.25H19.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M10 8.25H14M10 12.25H14M10 16.25H14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 15.25C13.795 15.25 15.25 13.795 15.25 12C15.25 10.205 13.795 8.75 12 8.75C10.205 8.75 8.75 10.205 8.75 12C8.75 13.795 10.205 15.25 12 15.25Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M18.25 12C18.25 11.55 18.2 11.12 18.11 10.7L20.15 9.12L18.15 5.65L15.73 6.62C15.08 6.12 14.35 5.75 13.55 5.54L13.25 3H9.25L8.95 5.54C8.15 5.75 7.42 6.12 6.77 6.62L4.35 5.65L2.35 9.12L4.39 10.7C4.3 11.12 4.25 11.55 4.25 12C4.25 12.45 4.3 12.88 4.39 13.3L2.35 14.88L4.35 18.35L6.77 17.38C7.42 17.88 8.15 18.25 8.95 18.46L9.25 21H13.25L13.55 18.46C14.35 18.25 15.08 17.88 15.73 17.38L18.15 18.35L20.15 14.88L18.11 13.3C18.2 12.88 18.25 12.45 18.25 12Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="19"
      viewBox="0 0 24 24"
      width="19"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.75 10.8C6.75 7.9 8.5 5.75 12 5.75C15.5 5.75 17.25 7.9 17.25 10.8V15.25L19 17H5L6.75 15.25V10.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M10 19.25C10.44 19.86 11.15 20.25 12 20.25C12.85 20.25 13.56 19.86 14 19.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

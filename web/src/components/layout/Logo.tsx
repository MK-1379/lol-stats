export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M16 2 28 9V23L16 30 4 23V9ZM8.75 17H12.75V23H8.75ZM14 13H18V23H14ZM19.25 9H23.25V23H19.25Z"
      />
    </svg>
  );
}

const CatLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={className ? undefined : { width: '40px', height: '40px' }}
    >
      <path
        d="M12 2 l2.5 6.5 6.5 2.5 -6.5 2.5 -2.5 6.5 -2.5 -6.5 -6.5 -2.5 6.5 -2.5z"
        fill="currentColor"
      />
    </svg>
  );
};

export default CatLogo;

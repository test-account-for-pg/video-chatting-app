declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Extend the global namespace to include Tailwind CSS classes
declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      className?: string;
    }
  }
}

export {};

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      className?: string;
    }
  }
}

export {};

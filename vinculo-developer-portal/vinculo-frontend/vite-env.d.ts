/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    'sb-ui-stepper': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'current-step'?: string }, HTMLElement>;
    'sb-ui-step': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { label?: string }, HTMLElement>;
    'sb-ui-datepicker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { label?: string; placeholder?: string; value?: string }, HTMLElement>;
    'sb-ui-modal': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { title?: string }, HTMLElement>;
    'sb-ui-dropdown': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'sb-ui-toast': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { message?: string; type?: string }, HTMLElement>;
  }
}

/* Type declarations for Seguros Bolívar Web Components */
declare namespace JSX {
  interface IntrinsicElements {
    'sb-ui-datepicker': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        label?: string;
        placeholder?: string;
        value?: string;
        disabled?: boolean;
        error?: string;
        helper?: string;
        min?: string;
        max?: string;
      },
      HTMLElement
    >;
    'sb-ui-modal': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        title?: string;
        open?: boolean;
        size?: 'small' | 'medium' | 'large';
      },
      HTMLElement
    >;
    'sb-ui-dropdown': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        label?: string;
        placeholder?: string;
        options?: string;
      },
      HTMLElement
    >;
    'sb-ui-toast': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        message?: string;
        type?: 'success' | 'error' | 'warning' | 'info';
        duration?: number;
      },
      HTMLElement
    >;
    'sb-ui-stepper': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        'current-step'?: string | number;
        orientation?: 'horizontal' | 'vertical';
      },
      HTMLElement
    >;
    'sb-ui-step': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        label?: string;
        description?: string;
        status?: 'active' | 'completed' | 'pending';
      },
      HTMLElement
    >;
  }
}

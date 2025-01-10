import { SVGProps } from 'react';

export default (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    fill="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      d="m13.16 22.19-1.66-3.84c1.6-.58 3.07-1.35 4.43-2.27l-2.78 6.11m-7.5-9.69-3.84-1.65 6.11-2.78C7 9.43 6.23 10.91 5.65 12.5M20 4c-2.96-.22-5.2.83-7.55 3.31-2.36 2.47-3.36 4.5-3.95 6.04l2.17 2.1c2.29-.87 4.33-2.18 6.03-3.89C20 8.27 20.17 5.4 20 4m-9 1.9c2.63-2.8 7-4.82 10.66-3.55 0 0 2.12 4.96-3.55 10.65-2.2 2.17-4.58 3.5-6.72 4.34-.24.09-1.15.39-2.13-.46l-2.13-2.13c-.56-.56-.74-1.38-.47-2.13C7.5 10.5 8.41 8.69 11 5.9M6.25 22H4.84l4.09-4.1c.3.21.63.36.97.45L6.25 22M2 22v-1.41l4.77-4.78 1.43 1.42L3.41 22H2m0-2.83v-1.42l3.65-3.65c.09.35.24.68.45.97L2 19.17M16 6a2 2 0 0 1 2 2c0 1.11-.89 2-2 2a2 2 0 1 1 0-4z"/>
  </svg>
);

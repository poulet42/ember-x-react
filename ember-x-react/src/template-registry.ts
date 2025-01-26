import type XReact from './components/x-react.ts';
import type XReactRoot from './components/x-react/root.ts';

export default interface XReactRegistry {
  'XReact::Root': typeof XReactRoot;
  XReact: typeof XReact;
}

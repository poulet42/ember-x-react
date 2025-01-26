import Component from '@glimmer/component';
import { type ComponentType } from 'react';

type PropsOf<T> =
  T extends ComponentType<infer P> ? Omit<P, 'children'> : never;

interface XReactSignature<T> {
  Args: {
    component: T;
    props?: PropsOf<T>;
  };
  Blocks: {
    default?: [];
  };
}

export default class XReact<T = ComponentType> extends Component<
  XReactSignature<T>
> {}

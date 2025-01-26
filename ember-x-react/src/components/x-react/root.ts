import templateOnlyComponent from '@ember/component/template-only';

interface XReactRootSignature {
  Element: HTMLDivElement;
  Blocks: {
    default: [];
  };
}

const XReactRoot = templateOnlyComponent<XReactRootSignature>();

export default XReactRoot;

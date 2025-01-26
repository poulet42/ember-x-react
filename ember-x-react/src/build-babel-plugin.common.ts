import { type Options } from 'babel-plugin-ember-template-compilation';

const options: Options = {
  transforms: [require.resolve('../dist/transform.common.js')],
  targetFormat: 'wire',
};

export function buildBabelPlugin() {
  return ['babel-plugin-ember-template-compilation', options] as const;
}

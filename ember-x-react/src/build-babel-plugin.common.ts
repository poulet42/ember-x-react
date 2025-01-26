import { type Options } from 'babel-plugin-ember-template-compilation';
import { transform } from './transform.common.ts';

const options: Options = {
  transforms: [transform],
};

export function buildBabelPlugin() {
  return [
    require.resolve('babel-plugin-ember-template-compilation'),
    options,
  ] as const;
}

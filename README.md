# ember-x-react

Render React components inside your ember templates:

```handlebars
<XReact::Root>
  <XReact @component={{this.Form}} @props={{hash onSubmit=this.handleSubmit}}>
    <label for='first-name'>{{t 'my-form.first-name'}}</label>
    <XReact
      @component={{this.TextField}}
      @props={{hash id='first-name' name='first-name'}}
    />
    <XReact @component={{this.Button}} @props={{hash type='submit'}}>
      {{t 'my-form.submit'}}
    </XReact>
  </XReact>
</XReact::Root>
```

## Features

✅ Supports nested React components and composition

✅ Supports React Context

✅ Low runtime footprint: XReact components are transformed into react components at **build time** !

✅ Use ember and react features together: Conditional components in a `{{#if}}` block, pass `@tracked` properties in props

✅ Supports DOM elements as children

✅ Props type safety in the template

## Limitations

❌ You cannot use the `yield` keyword inside a `XReact` component

❌ You cannot have ember components inside `XReact` components

## Compatibility

- Ember.js v4.12 or above
- Embroider or ember-auto-import v2

## Installation

```
ember install ember-x-react
```

## Setup

### Add the babel plugin in your config:

Most of the transformation logic is made at build time via a babel plugin; Add the plugin in your ember-cli-build.js configuration:

```javascript
new EmberApp(defaults, {
  babel: {
    plugins: [
      // ...
      require('ember-x-react').buildBabelPlugin(),
    ],
  },
});
```

or directly in your Babel config file if you enabled `useBabelConfig: true`

### Update your bundler configuration to handle JSX:

if your app is using embroider with webpack, you need to tell webpack how to handle JSX:

```javascript
rules: [
  // ...
  {
    test: /\.jsx/, // replace or add tsx if you use typescript
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          // Add other presets here if you need Typescript support for example
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    },
  },
];
```

## Usage

### Simple usage

```gjs
import XReactRoot from 'ember-x-react/components/x-react/root';
import XReact from 'ember-x-react/components/x-react';
import MyButton from './my-button.tsx';

export default class MyForm extends Component {

  ...

  get isFormPending() {
    return this.submitTask.isPending;
  }

  <template>
    <form>
      <MyEmberDropdown />
      <XReact::Root>
        <XReact @component={{MyButton}} @props={{hash isPending=this.isFormPending}}>
          {{#if this.isFormPending}}
            Submitting ...
          {{else}}
            Submit
          {{/if}}
        </XReact>
      </XReact::Root>
    </form>
  </template>
}
```

### What about context providers ?

The components passed to XReact can be any valid React components, this means you can just do:

```gjs
<template>
  <XReact::Root>
    <XReact @component={{MyIntlProvider}}>
      <XReact @component={{FormattedMessage}} @props={{id="hello.world"}} />
    </XReact>
  </XReact::Root>
</template>
```

### Usage with HBS templates

Create a backing component class for your HBS template, then add the React component as a property of this class:

```js
import { MyButton } from './my-button.tsx';

export default MyEmberComponent extends Component {
  myReactButton = MyButton;
}
```

Then, you can render your react component by referencing the class property:

```handlebars
<XReact @component={{this.myReactButton}} />
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).

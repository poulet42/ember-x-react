import Controller from '@ember/controller';
import { MyComponent } from './my-component.tsx';

export default class ApplicationController extends Controller {
  myComponent = MyComponent;
}

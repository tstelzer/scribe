// FIXME: Proper export, this is just for testing.
import {toConfig} from './io/config';
import {scribe} from './scribe';

scribe(toConfig());

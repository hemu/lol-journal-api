import { merge } from 'lodash';
import entryResolver from './entry';
import noteResolver from './note';

export default merge(entryResolver, noteResolver);

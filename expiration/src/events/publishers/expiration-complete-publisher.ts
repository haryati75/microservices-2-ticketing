import { Subjects, Publisher, ExpirationCompleteEvent } from '@charityx/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
}

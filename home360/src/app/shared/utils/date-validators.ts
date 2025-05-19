import { FormGroup } from '@angular/forms';

export function startTimeValidator(control: FormGroup) {
  if (!control.get('startTime')?.value || !control.get('endTime')?.value) {
    return null;
  }
  const startTime = new Date(control.get('startTime')!.value);
  const nowPlusTwoHours = new Date();
  nowPlusTwoHours.setHours(nowPlusTwoHours.getHours() + 2);
  const threeWeeksFromNow = new Date();
  threeWeeksFromNow.setDate(threeWeeksFromNow.getDate() + 21);

  if (startTime < nowPlusTwoHours) {
    return { startTimeTooEarly: true };
  }
  if (startTime > threeWeeksFromNow) {
    return { startTimeTooLate: true };
  }
  return null;
}

export function endTimeValidator(control: FormGroup) {
  if (!control.get('startTime')?.value || !control.get('endTime')?.value) {
    return null;
  }
  const startTime = new Date(control.get('startTime')!.value);
  const endTime = new Date(control.get('endTime')!.value);

  if (endTime <= startTime) {
    return { endTimeBeforeStartTime: true };
  }
  const threeWeeksFromStartTime = new Date(startTime);
  threeWeeksFromStartTime.setDate(threeWeeksFromStartTime.getDate() + 21);
  if (endTime > threeWeeksFromStartTime) {
    return { endTimeTooLate: true };
  }
  return null;
}

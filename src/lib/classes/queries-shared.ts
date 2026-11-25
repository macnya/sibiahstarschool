/** "Grade 4" + "Blue" -> "Grade 4 Blue". Safe to import anywhere. */
export const classLabel = (gradeName: string | undefined, stream: string) => `${gradeName ?? 'Class'}${stream ? ` ${stream}` : ''}`;

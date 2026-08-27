export function getQuestionTypeLabel(type?: string): string {
  switch (type) {
    case 'short-text':
      return 'Short Text Answer';
    case 'long-text':
      return 'Long Text Answer';
    case 'multiple-choice':
      return 'Multiple Choice';
    case 'checkbox-group':
      return 'Multiple Selection';
    case 'radio-with-text':
      return 'Choice with Explanation';
    case 'number':
      return 'Numeric Input';
    case 'code':
      return 'Code / Pseudocode';
    default:
      return 'Problem Solving';
  }
}

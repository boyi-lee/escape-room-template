# Learning Loop Specification

## Objective
Convert chapter progress from passive page opens into observable learning behaviors.

## Loop
1. Read: open the chapter and review the illustrated Cornell notes.
2. Recall: confirm that the learner can explain the core idea without looking at the text.
3. Apply: complete level-appropriate questions with explanatory feedback.
4. Review: schedule a later revisit and surface due chapters on the learning route.

## Level thresholds
- Beginner: 2 of 3 questions.
- Classical translator: 3 of 3 questions.
- Source reader: 3 of 3 questions plus source verification acknowledgement.

## State model
Each chapter stores:
- opened
- sourceChecked
- correct question indexes
- attempts
- stage 0-4
- lastStudiedAt
- nextReviewAt

## Quality gates
- A chapter is not complete from opening alone.
- Feedback explains the reasoning and links back to notes.
- Advanced completion requires source review.
- Review-due status is computed from time, not manually labelled.
- Progress is stored with parse-error handling.

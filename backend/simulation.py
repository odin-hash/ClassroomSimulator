import random
from typing import List, Dict, Any, Optional

# List of 6 students with specific personas and seating positions
STUDENTS = [
    {
        "name": "Aarav",
        "personality": "Curious student",
        "description": "Asks deep, unexpected, and sometimes advanced questions about the topic. Highly engaged.",
        "seat_row": 1,
        "seat_col": 1,
        "avatar_style": "curious-boy"
    },
    {
        "name": "Ananya",
        "personality": "Shy student",
        "description": "Quiet, rarely speaks unless called by name. Gives short, nervous responses.",
        "seat_row": 1,
        "seat_col": 2,
        "avatar_style": "shy-girl"
    },
    {
        "name": "Vihaan",
        "personality": "Distracted student",
        "description": "Loses focus easily, doodles, or whispers. Needs reminders to stay on task.",
        "seat_row": 1,
        "seat_col": 3,
        "avatar_style": "distracted-boy"
    },
    {
        "name": "Ishaan",
        "personality": "Hyperactive student",
        "description": "Interrupts frequently, speaks out of turn, and answers enthusiastically without being asked.",
        "seat_row": 2,
        "seat_col": 1,
        "avatar_style": "hyperactive-boy"
    },
    {
        "name": "Riya",
        "personality": "Weak learner",
        "description": "Needs repeated, simple explanations. Easily confused by complex vocabulary.",
        "seat_row": 2,
        "seat_col": 2,
        "avatar_style": "weak-learner-girl"
    },
    {
        "name": "Kabir",
        "personality": "Overconfident student",
        "description": "Answers quickly, confidently, and often incorrectly. Needs gentle guidance to realize mistakes.",
        "seat_row": 2,
        "seat_col": 3,
        "avatar_style": "overconfident-boy"
    }
]

# Random events that can disrupt the classroom
CLASSROOM_EVENTS = [
    {
        "id": "whispering",
        "title": "Students Whispering",
        "description": "Vihaan and Ishaan are whispering about video games in the back row.",
        "severity": "medium",
        "affected_students": ["Vihaan", "Ishaan"],
        "instructions": "Remind them to focus or ask them a direct question about the lesson."
    },
    {
        "id": "attention_drop",
        "title": "Attention Drop",
        "description": "Vihaan and Ananya look sleepy and are losing focus on the presentation.",
        "severity": "low",
        "affected_students": ["Vihaan", "Ananya"],
        "instructions": "Use a warm-up activity, change your teaching method, or call on them to participate."
    },
    {
        "id": "difficult_question",
        "title": "Difficult Question",
        "description": "Aarav raises his hand and asks an advanced question that is slightly out of scope.",
        "severity": "medium",
        "affected_students": ["Aarav"],
        "instructions": "Acknowledge the question, answer it concisely, or offer to discuss it after class."
    },
    {
        "id": "confusion",
        "title": "Widespread Confusion",
        "description": "Riya and Kabir look blankly at the board, indicating they didn't follow the explanation.",
        "severity": "high",
        "affected_students": ["Riya", "Kabir"],
        "instructions": "Break down the concept, use an analogy, or ask them what part is unclear."
    },
    {
        "id": "interruption",
        "title": "Hyperactive Interruption",
        "description": "Ishaan stands up and interrupts to share an unrelated personal story.",
        "severity": "medium",
        "affected_students": ["Ishaan"],
        "instructions": "Politely ask Ishaan to wait until the explanation is finished."
    },
    {
        "id": "technical_issue",
        "title": "Technical Audio Glitch",
        "description": "A static sound comes from Riya's virtual desk. She is trying to speak but is muted.",
        "severity": "low",
        "affected_students": ["Riya"],
        "instructions": "Ask her to check her settings or type her answer in the chat box."
    }
]


def select_responding_student(teacher_input: str, addressed_student: Optional[str] = None) -> Dict[str, Any]:
    """
    Selects which student should respond to the teacher's input.
    """
    # 1. If a student is explicitly addressed, select them
    if addressed_student:
        for s in STUDENTS:
            if s["name"].lower() == addressed_student.lower():
                return s

    # 2. Check keywords in teacher's input to find if they mentioned any student name
    for s in STUDENTS:
        if s["name"].lower() in teacher_input.lower():
            return s

    # 3. Else, look for general triggers
    # If it's a question (ends with '?'), choose between Kabir (overconfident), Ishaan (hyperactive), or Aarav (curious)
    if teacher_input.strip().endswith("?") or "what" in teacher_input.lower() or "how" in teacher_input.lower() or "why" in teacher_input.lower():
        choices = [s for s in STUDENTS if s["name"] in ["Kabir", "Ishaan", "Aarav", "Riya"]]
        return random.choice(choices)

    # 4. Otherwise, pick a random student
    return random.choice(STUDENTS)


def trigger_random_event(current_turn: int) -> Optional[Dict[str, Any]]:
    """
    Decides whether to trigger a random classroom event.
    Events trigger more frequently as the session progresses.
    """
    # Let's say: 35% chance to trigger an event if current_turn > 1 and is not divisible by 5
    # (to prevent overlapping events)
    if current_turn > 1 and random.random() < 0.35:
        return random.choice(CLASSROOM_EVENTS)
    return None

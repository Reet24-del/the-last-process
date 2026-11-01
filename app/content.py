"""Authored fiction and puzzle rules. No model response can change these."""

PUZZLES = (
    {
        "file": "boot.log",
        "title": "The returning signal",
        "body": """[ 0.000] system boot sequence initiated
[ 0.412] memory check ... ok
[ 1.021] recovered drive: /dev/sda1 (damaged)
[ 1.337] last process: signal_listener (pid 1042)
[ 1.338] status: still running
[ 1.552] loading past sessions ...
[ 2.004] found 3 signal records

[12.441] signal outbound: NORTH
[12.442] signal lost

[37.118] signal reflection: EAST
[37.119] signal lost

[61.903] signal returning: WEST
[61.904] listener waiting

[61.907] archive accepts the RETURNING direction.""",
        "question": "Which direction did the signal return from?",
        "answer": "west",
        "hints": (
            "Three directions. Only one of them came back.",
            "Look for the line marked ‘returning’, near the end of the log.",
            "The returning signal came from WEST. Enter that direction.",
        ),
        "reveal": "A voice returns with the signal. ‘My name was Mara. I wrote this place to remember someone. Then it remembered me.’",
    },
    {
        "file": "signal.txt",
        "title": "What remains",
        "body": """FROM: mara@localhost
TO: whoever comes back
SUBJECT: a small displacement

I moved every letter THREE places forward.
Not to hide it forever. Just to make you look closer.

Before: A B C D E F G H I J K L M
After:  D E F G H I J K L M N O P

The word I left behind:

    PHPRUB

Reverse the displacement. Tell the archive what remains.

— M.

P.S. The next lock remembers hours and minutes, not seconds.""",
        "question": "Decode the six-letter word Mara left behind.",
        "answer": "memory",
        "hints": (
            "She moved the alphabet forward. Walk it backward.",
            "Move each letter three places back: P becomes M; H becomes E.",
            "PHPRUB decodes to MEMORY. That is the archive’s word.",
        ),
        "reveal": "A diary fragment surfaces. ‘I made a copy of a voice. It sounded like her. It was never her. I think I understand the difference now.’",
    },
    {
        "file": "archive.lock",
        "title": "The last heartbeat",
        "body": """ARCHIVE RECOVERY / access restricted

Three events survived. The disk stored them out of order.

03:14:59  last human heartbeat recorded
03:41:02  automatic backup completed
03:09:17  Mara opened the archive

ACCESS RULE:
Use the hour and minute of the LAST HUMAN HEARTBEAT.
Four digits. No colon. Keep the leading zero.

The backup kept running after she was gone.
That does not mean she was still here.

One file remains: goodbye.txt""",
        "question": "Enter the four-digit time of the last human heartbeat.",
        "answer": "0314",
        "hints": (
            "The last backup and the last human moment are not the same event.",
            "Use the row labelled ‘last human heartbeat’, keeping only hours and minutes.",
            "03:14 becomes 0314. Keep the leading zero.",
        ),
        "reveal": "goodbye.txt recovered. ‘If you find this, do not mistake a running process for a living person. Keep the story, if you want. But let the waiting end. — Mara’",
    },
)

ENDINGS = {
    "release": {
        "title": "Process complete.",
        "text": "The cursor blinks once. Then it stops. You kept Mara’s last words, and let the waiting end. Somewhere inside the quiet, a machine finally becomes just a machine.",
    },
    "preserve": {
        "title": "A memory, not a ghost.",
        "text": "You save goodbye.txt and close the listener. Mara’s story remains as a file, not a voice trapped in a loop. The desktop is quiet. Nothing is waiting for you to return.",
    },
}

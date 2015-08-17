TestGen4Web - Why this name? The tool is intended to generate test scripts for websites.

At its basic, testgen4web can record and playback your everyday tasks like logging into a website every morning.

Or, if you are a web developer and need to get to a page quickly every time you change your code, you quickly record a series of actions, and playback when you are ready.

# Firefox Addon #
Just like your DVR at home, you hit record, and hit stop after its recorded.

The recordings will be saved as an xml to be played back later, or just stored in-memory for transient recordings.

The firefox addon has editing capabilities to add
  * Loops with conditions
  * Loops with datasets
  * Conditions
  * Variables

# Command Line Run #

Once the recordings are finalized, they will be saved as xmls, which can then be used to run from the command line as part of nightly tests.

The XML reader uses HTMLUnit java browser to run the tests, and produces a html report for the tests.
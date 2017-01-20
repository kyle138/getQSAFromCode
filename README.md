# getQSAFromCode
Lambda backend accepts pass code and URL for S3 object,
checks specified bucket for passcode.txt object,
compares provided pass code with contents of passcode.txt,
and if it matches returns the QSA signed URL for the object.

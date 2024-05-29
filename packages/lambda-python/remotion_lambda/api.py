import boto3
import json
class S3Utils:

     # pylint: disable=too-many-arguments
    def __init__(self, region, serve_url, function_name, access_key=None, secret_key=None):
        """
        Initialize the RemotionClient.

        Args:
            region (str): AWS region.
            serve_url (str): URL for the Remotion service.
            function_name (str): Name of the AWS Lambda function.
            access_key (str): AWS access key (optional).
            secret_key (str): AWS secret key (optional).
        """
        self.access_key = access_key
        self.secret_key = secret_key
        self.region = region
        self.serve_url = serve_url
        self.function_name = function_name
        self.s3 = boto3.client("s3")



    def __init__(self, bucket_name):
        self.bucket = boto3.resource("s3").Bucket(bucket_name)

    def load(self, key):
        return json.load(self.bucket.Object(key=key).get()["Body"])

    def dump(self, key, obj):
        return self.bucket.Object(key=key).put(Body=json.dumps(obj))
    
    def _create_bucket(self, bucket_name): 
        self.s3.create_bucket(Bucket=bucket_name, CreateBucketConfiguration={
         'LocationConstraint': self.region})
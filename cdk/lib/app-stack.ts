import { Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as cf from "aws-cdk-lib/aws-cloudfront";
// import * as cfOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import * as iam from "aws-cdk-lib/aws-iam";

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const siteIndex = "index.html";

    const cfAccessIdenyity = new cf.OriginAccessIdentity(this, "CfIdentity");

    const bucket = new s3.Bucket(this, "Bucket", {
      bucketName: "nodejs-aws-shop-react-task2-cdk",
      websiteIndexDocument: siteIndex,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["S3:GetObject"],
        resources: [bucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cfAccessIdenyity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    const cfDistribution = new cf.CloudFrontWebDistribution(
      this,
      "AppDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: bucket,
              originAccessIdentity: cfAccessIdenyity,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
      }
    );
    // bucket.grantRead(cfAccessIdenyity);

    // const cfDistribution = new cf.Distribution(this, "AppDistribution", {
    //   defaultBehavior: {
    //     origin: new cfOrigins.S3Origin(bucket, {
    //       originAccessIdentity: cfAccessIdenyity,
    //     }),
    //     viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //   },
    //   priceClass: cf.PriceClass.PRICE_CLASS_100,
    //   defaultRootObject: "index.html",
    // });

    new s3Deployment.BucketDeployment(this, "AppDeployment", {
      destinationBucket: bucket,
      sources: [s3Deployment.Source.asset("./dist")],
      distribution: cfDistribution,
      distributionPaths: ["/*"],
    });

    // new CfnOutput(this, "FrontendAppDNS", {
    //   value: cfDistribution.distributionDomainName,
    // });
  }
}

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state in S3. Run ONCE before terraform init:
  #   aws s3 mb s3://landshoppers-tf-state-107094296860 --region us-west-1
  #   aws dynamodb create-table --table-name landshoppers-tf-locks \
  #     --attribute-definitions AttributeName=LockID,AttributeType=S \
  #     --key-schema AttributeName=LockID,KeyType=HASH \
  #     --billing-mode PAY_PER_REQUEST --region us-west-1
  backend "s3" {
    bucket         = "landshoppers-tf-state-107094296860"
    key            = "landshoppers/terraform.tfstate"
    region         = "us-west-1"
    dynamodb_table = "landshoppers-tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "landshoppers"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

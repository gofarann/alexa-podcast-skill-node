This guide uses setup instructions from the [Alexa City Guide Sample Code for Node JS](https://github.com/alexa/skill-sample-nodejs-city-guide/blob/master/README.md).

## Overview
This repo contains a template to build your own podcast specific Alexa skill. Once setup, you will be able to find and play podcasts through your Echo with the following intents:

   > "Alexa, open episode lookup and find episode one hundred."
     > "Tell me about the episode."
     > "Play episode"

   > "Alexa, open episode lookup and find an episode about 'economics'."
     > "Description."
     > "Next Result."

   > "Alexa, open episode lookup and find last week's episode."
     > "Play episode."

## Tech Stack
This template uses the [Alexa Skills Kit SDK](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs) for Node.js.

The function will be hosted on [AWS Lambda](https://aws.amazon.com/lambda/) and deployed through the Alexa Skills Kit on the Amazon Developer Console.

This Alexa Skill template is powered by the [audiosear.ch podcast API](https://www.audiosear.ch/).

# Let's Get Started

## Step 1. Setting up Your Alexa Skill in the Developer Portal

Skills are managed through the Amazon Developer Portal. You’ll link the Lambda function you created above to a skill defined in the Developer Portal.

1.  Navigate to the Amazon Developer Portal. Sign in or create a free account (upper right). You might see a different image if you have registered already or our page may have changed. If you see a similar menu and the ability to create an account or sign in, you are in the right place.

    ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/amazon-developer-portal._TTH_.png)

2.  Once signed in, navigate to Alexa and select **"Getting Started"** under Alexa Skills Kit.

    ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/alexa-skills-kit._TTH_.png)

3.  Here is where you will define and manage your skill. Select **"Add a New Skill"**

    ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/add-a-new-skill.png)

4.  There are several choices to make on this page, so we will cover each one individually.
    1. Choose the language you want to start with.  You can go back and add all of this information for each language later, but for this tutorial, we are working with "English (U.S.)"
    2. Make sure the radio button for the Custom Interaction Model is selected for “Skill Type”.
    3. Add the name of the skill. Give your skill a name that is simple and memorable, like "Seattle Guide." The name will be the one that shows up in the Alexa App (and now at [amazon.com/skills](https://www.amazon.com/skills)) when users are looking for new skills.  
    4. Add the invocation name. This is what your users will actually say to start using your skill. We recommend using only two or three words, because your users will have to say this every time they want to interact with your skill.
    5. Under "Global Fields," select "yes" for Audio Player, as our skill will be playing any audio.  
    6. Select **Next**.

    ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/city-guide/create-a-new-alexa-skill._TTH_.png)

5.  Next, we need to define our skill’s interaction model. Let’s begin with the intent schema. In the context of Alexa, an intent represents an action that fulfills a user’s spoken request.

6. This podcast skill will use the provided intent schema and utterances in the 'speechAssets' folder of 'alexa-podcast-skill-template'. You can load the code directly into the code editor of the Interaction Model Builder.  You can see that we have defined a set of standard built-in intents: Yes, No, Help, Stop, Cancel, and Repeat.  These are built-in intents that we can use for common commands our users will indicate.

7.  Select **Save**. You should see the interaction model being built (this might take a minute or two). If you select Next, your changes will be saved and you will go directly to the Configuration screen.

Next we will configure the AWS Lambda function that will host the logic for our skill.

## Step 2: Creating Your Skill Logic using AWS Lambda

### Installing and Working with the Alexa Skills Kit SDK for Node.js (alexa-sdk)

To make the development of skills easier, we will use the ASK SDK for Node.js. We will be using this module to deploy the sample. The alexa-sdk is available on [github here](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs) and can be deployed as a node package from within your Node.js environment.

1.  To leverage the SDK for ASK you will need to install Node.js and update npm. To set this up on your machine, [follow these steps](https://docs.npmjs.com/getting-started/installing-node).

2.  Once you have the source downloaded, node.js installed and npm updated, you are ready to install the node packages. Install this in the same directory as your podcast skill's src/index.js file you downloaded earlier. Change the directory to the src directory of your skill, and then on the command line, type:

    ```
    npm install
    ```
    Once this is installed you will need to include the **node_modules** directory with the source code for your skill when you compress the src for uploading to AWS Lambda. Let's do this with the example.

3.  Navigate to where you downloaded the sample respository and installed the Alexa SDK in step 3. Select the **src** directory.

4.  Compress the files inside the src directory into a zip file. **Remember**, do not compress the src directory itself, just the files within the directory. (The index.js file and the node_modules folder.) Your compressed file should show up in the src directory. You will use this file in a later step.

    ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/create-compressed-folder._TTH_.png)


    ### Create an AWS Lambda Function

    AWS Lambda lets you run code without provisioning or managing servers. You pay only for the compute time you consume - there is no charge when your code is not running. With Lambda, you can run code for virtually any type of application or backend service - all with zero administration. Just upload your code and Lambda takes care of everything required to run and scale your code with high availability.

    **Note: If you are new to Lambda and would like more information, visit the [Lambda Getting Started Guide](http://docs.aws.amazon.com/lambda/latest/dg/getting-started.html).**

    1.  **IMPORTANT**: Select **US East (N. Virginia)** region, or the **EU (Ireland)** region (upper right corner).  You should choose the region geographically closest to your audience. These are currently the only regions that currently support Alexa skill development.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/select-aws-region._TTH_.png)

    2.  Select **Lambda** from AWS Services (under Compute)

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/lambda._TTH_.png)

    3.  Select **“Create a Lambda Function”** to begin the process of defining your Lambda function.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/create-a-lambda-function._TTH_.png)

    4.  Select the **Blank Function** option on the Select Blueprint screen.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/select-blank-function._TTH_.png)

    5.  Now, you need to configure the event that will trigger your function to be called. As we are building skills with the Alexa Skills Kit, click on the gray dash-lined box and select Alexa Skills Kit from the dropdown menu.  (If you don't see this option, go back to Step #1 and select the appropriate AWS region).  This gives the Alexa service permission to invoke your skill's function.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/configure-triggers._TTH_.png)

    6.  Choose **Next** to continue.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/configure-triggers-2._TTH_.png)

    7.  You should now be in the **"Configure Function"** section. Enter the Name, Description, and Runtime for your skill as in the example below.  Your runtime should be "Node.js 4.3."

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/city-guide/configure-function._TTH_.png)

    8.  Select the **‘Code Entry Type’** as **‘Upload Zip File’** and upload the zip file containing the example you created in Step 1. **Note:** This zip file should contain the contents of the src directory, including the node_modules subfolder.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/upload-a-zip-file._TTH_.png)

    9.  Set your handler and role as follows:

        * Keep Handler as ‘index.handler’
        * Drop down the “Role” menu and select **“Create a custom role”**. (Note: if you have already used Lambda you may already have a ‘lambda_basic_execution’ role created that you can use.) This will launch a new tab in the IAM Management Console.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/create-a-custom-role._TTH_.png)

    10. You will be asked to set up an Identity and Access Management or “IAM” role if you have not done so. AWS Identity and Access Management (IAM) enables you to securely control access to AWS services and resources for your users. Using IAM, you can create and manage AWS users and groups, and use permissions to allow and deny their access to AWS resources. The IAM role will give your Lambda function permission to use other AWS Services at runtime, such as Cloudwatch Logs, the AWS logs collection and storage service. In the Role Summary section, select "Create a new IAM Role" from the IAM Role dropdown menu. The Role Name and policy document will automatically populate.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/lambda-settings._TTH_.png)

    11. Select **“Allow”** in the lower right corner and you will be returned to your Lambda function.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/lambda-function-handler._TTH_.png)

    12. Keep the Advanced settings as default. Select **‘Next’** and review. You should see something like below. Then select **‘Create Function’**:

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/city-guide/lambda-review._TTH_.png)

    13. Congratulations, you have created your AWS Lambda function. **Copy** the Amazon Resource Name (ARN) for use in the Configuration section of the Amazon Developer Portal.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/city-guide/lambda-congratulations._TTH_.png)

    ## Step 3: Add Your Lambda Function to Your Skill

    1.  Navigate back to [developer.amazon.com](http://developer.amazon.com) and select your skill from the list. You can select the skill name or the edit button.


    2.  Select the Configuration section, and make sure to choose the AWS Lambda ARN region that corresponds to your AWS Lambda function's region.  Add the ARN from the Lambda function you created in the AWS Console earlier. Select the **Lambda ARN (Amazon Resource Name)** radio button. Then, select **“No”** for account linking since we will not be connecting to an external account for this tutorial. Paste the ARN you copied earlier into the Endpoint field. Then select **Next**.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/city-guide/configuration._TTH_.png)

    3.  You will be asked if you want to "Save Global Changes."  This happens because you are changing values that would apply to every version of your skill (in every language.)  You can click "Yes, Apply" to complete this step.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/save-global-changes._TTH_.png)

    4.  You have now completed the initial development of your skill. Now it is time to test.

    ## Step 4: Testing Your Skill

    1.  In the Test area, we are going to enter a sample utterance in the service simulator section and see how Alexa will respond. In this example, we have called the skill ‘Seattle Guide,’ because we will be returning information about the city of Seattle. This is the ‘Invocation Name’ we set up on the Skill Information line in the “Skill Information” section.

        * In the Service Simulator, type **‘open [invocation name]’** and click the **“Ask [Your Skill Name]”** button.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/city-guide/service-simulator._TTH_.png)

    2.  You should see the formatted JSON request from the Alexa service and the response coming back from your Lambda function. Verify that you get a correct Lambda response.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/city-guide/service-simulator-json._TTH_.png)

    3.  (Optional) Testing with your device. This is optional as you can do all the testing in the portal. Assuming your Echo device is on-line (and logged in with the same account as your developer account), you should now see your skill enabled in the Alexa app (under "Your Skills," in the top right corner) and ask Alexa to launch your skill. For more information on testing an Alexa skill and registering an Alexa-enabled device, [check here](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/testing-an-alexa-skill).

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/city-guide/alexa-skill-app._TTH_.png)

        Another option for testing your device with your voice is [Echosim.io](http://echosim.io).  This is a virtual Alexa device in your browser, created and hosted by iQuarius Media, that you can speak to and get responses from, just like having a physical device in front of you.

        ![](https://images-na.ssl-images-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/echosim._TTH_.png)

    ### Skills / Lambda Troubleshooting (getting an invalid response)?
     * Do you have the right ARN copied from your Lambda function into your Developer Portal / skill?
     * Are you calling the right invocation name?
     * Are you saying launch, start or open (followed by your invocation name)?
     * Are you sure you have no other skills in your accounts with the same invocation name?



     ## Check out These Other Developer Resources

     * [Alexa Skills Kit (ASK)](https://developer.amazon.com/ask)
     * [Alexa Skill Submission Checklist](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-submission-checklist#submission-checklist)
     * [Alexa Developer Forums](https://forums.developer.amazon.com/spaces/165/index.html)
     * [Knowledge Base](https://goto.webcasts.com/starthere.jsp?ei=1090197)
     * [Intro to Alexa Skills Kit  - On Demand Webinar](https://goto.webcasts.com/starthere.jsp?ei=1090197)
     * [Voice Design 101 - On Demand Webinar](https://goto.webcasts.com/starthere.jsp?ei=1087594)
     * [Developer Office Hours](https://attendee.gotowebinar.com/rt/8389200425172113931)

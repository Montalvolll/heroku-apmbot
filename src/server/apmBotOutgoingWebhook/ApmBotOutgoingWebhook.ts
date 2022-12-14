import * as builder from "botbuilder";
import * as express from "express";
import * as crypto from "crypto";
import {
    OutgoingWebhookDeclaration,
    IOutgoingWebhook
} from "express-msteams-host";

/**
 * Implementation for apm_bot Outgoing Webhook
 */
@OutgoingWebhookDeclaration("/api/webhook")
export class ApmBotOutgoingWebhook implements IOutgoingWebhook {
    /**
     * Implement your outgoing webhook logic here
     * @param req the Request
     * @param res the Response
     * @param next
     */
    public requestHandler(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        // parse the incoming message
        let incoming = req.body as builder.Activity;

        // create the response, any Teams compatible responses can be used
        let message: Partial<builder.Activity> = {
            type: builder.ActivityTypes.Message
        };

        const securityToken = process.env.SECURITY_TOKEN;
        if (securityToken && securityToken.length > 0) {
            // There is a configured security token
            const auth = req.headers.authorization;
            const msgBuf = Buffer.from((req as any).rawBody, "utf8");
            const msgHash =
                "HMAC " +
                crypto
                    .createHmac(
                        "sha256",
                        Buffer.from(securityToken as string, "base64")
                    )
                    .update(msgBuf)
                    .digest("base64");
            console.log(incoming.text);
            if (msgHash === auth) {
                // Message was ok and verified
                // message.text = `Echo ${incoming.text}`;
                if (incoming.text.includes("testing")) {
                    message.text = "This is an an automated test reply";
                } else {
                    message.text = "Unknown command";
                }
            } else {
                // Message could not be verified
                message.text = "Error: message sender cannot be verified";
            }
        } else {
            // There is no configured security token
            message.text =
                "Error: outgoing webhook is not configured with a security token";
        }

        // send the message
        res.send(JSON.stringify(message));
    }
}

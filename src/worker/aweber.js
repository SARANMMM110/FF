/**
 * AWeber API Integration
 * Handles syncing email subscribers to AWeber lists
 */
/**
 * Add a subscriber to AWeber list
 */
export async function addAWeberSubscriber(env, subscriber) {
    // Check if AWeber is configured
    if (!env.AWEBER_ACCESS_TOKEN || !env.AWEBER_ACCOUNT_ID || !env.AWEBER_LIST_ID) {
        console.log("⚠️ [AWeber] Not configured, skipping sync");
        return { success: false, error: "AWeber not configured" };
    }
    try {
        const url = `https://api.aweber.com/1.0/accounts/${env.AWEBER_ACCOUNT_ID}/lists/${env.AWEBER_LIST_ID}/subscribers`;
        const payload = {
            email: subscriber.email,
            tags: subscriber.tags || [],
            ad_tracking: subscriber.ad_tracking || "focusflow-signup",
        };
        // Add name if provided
        if (subscriber.name) {
            payload.name = subscriber.name;
        }
        // Add custom fields if provided
        if (subscriber.custom_fields) {
            payload.custom_fields = subscriber.custom_fields;
        }
        console.log("📧 [AWeber] Adding subscriber:", { email: subscriber.email, list_id: env.AWEBER_LIST_ID });
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.AWEBER_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const responseText = await response.text();
        if (!response.ok) {
            // Check if subscriber already exists (this is not an error)
            if (response.status === 400 && responseText.includes("already subscribed")) {
                console.log("ℹ️ [AWeber] Subscriber already exists:", subscriber.email);
                return { success: true, error: "already_subscribed" };
            }
            console.error("❌ [AWeber] API error:", {
                status: response.status,
                statusText: response.statusText,
                body: responseText,
            });
            return {
                success: false,
                error: `AWeber API error: ${response.status} ${response.statusText}`
            };
        }
        let data;
        try {
            data = JSON.parse(responseText);
        }
        catch (e) {
            console.error("❌ [AWeber] Failed to parse response:", responseText);
            return { success: false, error: "Invalid response from AWeber" };
        }
        console.log("✅ [AWeber] Subscriber added successfully:", {
            email: subscriber.email,
            subscriber_id: data.id,
        });
        return {
            success: true,
            subscriber_id: data.id
        };
    }
    catch (error) {
        console.error("❌ [AWeber] Error adding subscriber:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}
/**
 * Update subscriber tags in AWeber
 */
export async function updateAWeberSubscriberTags(env, email, tags) {
    if (!env.AWEBER_ACCESS_TOKEN || !env.AWEBER_ACCOUNT_ID || !env.AWEBER_LIST_ID) {
        return { success: false, error: "AWeber not configured" };
    }
    try {
        // First, find the subscriber
        const findUrl = `https://api.aweber.com/1.0/accounts/${env.AWEBER_ACCOUNT_ID}/lists/${env.AWEBER_LIST_ID}/subscribers?ws.op=find&email=${encodeURIComponent(email)}`;
        const findResponse = await fetch(findUrl, {
            headers: {
                "Authorization": `Bearer ${env.AWEBER_ACCESS_TOKEN}`,
            },
        });
        if (!findResponse.ok) {
            return { success: false, error: "Subscriber not found" };
        }
        const findData = await findResponse.json();
        if (!findData.entries || findData.entries.length === 0) {
            return { success: false, error: "Subscriber not found" };
        }
        const subscriberId = findData.entries[0].id;
        // Update tags
        const updateUrl = `https://api.aweber.com/1.0/accounts/${env.AWEBER_ACCOUNT_ID}/lists/${env.AWEBER_LIST_ID}/subscribers/${subscriberId}`;
        const updateResponse = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${env.AWEBER_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tags }),
        });
        if (!updateResponse.ok) {
            return { success: false, error: "Failed to update tags" };
        }
        console.log("✅ [AWeber] Updated tags for:", email);
        return { success: true };
    }
    catch (error) {
        console.error("❌ [AWeber] Error updating tags:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

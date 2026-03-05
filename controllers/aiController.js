const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Get AI Chatbot response
// @route   POST /api/ai/chat
// @access  Private
const getAIResponse = async (req, res) => {
    const { message, context } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI assistant for a Student-Teacher Appointment system. You help students book appointments, find teacher availability, and answer FAQs about the college. Context: " + (context || "No additional context.")
                },
                {
                    role: "user",
                    content: message
                }
            ],
        });

        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'AI Chatbot error', error: error.message });
    }
};

module.exports = {
    getAIResponse,
};

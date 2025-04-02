import './App.css';
import { useState, useEffect, useRef } from 'react';
import ideaIcon from './assets/icons/idea.png';
import writingIcon from './assets/icons/writing.png';
import pitchingIcon from './assets/icons/pitching.png';
import txtIcon from './assets/icons/txt.png';  // Import txt icon
import AddIcon from './assets/icons/Add.png';  // Import Add icon
import ChatAgent from './ChatAgent';

// ReflectionModal Component
const ReflectionModal = ({ isOpen, onClose, onSubmit }) => {
  const initialState = {
    skillImprovement: {
      entrepreneurialThinking: [],
      entrepreneurialSpirit: [],
      entrepreneurialSkills: [],
      otherSkills: ''
    },
    gptInfluence: '',
    communication: '',
    ideaModification: {
      hasModification: false,
      modifiedIdea: ''
    }
  };

  const [skillImprovement, setSkillImprovement] = useState(initialState.skillImprovement);
  const [gptInfluence, setGptInfluence] = useState(initialState.gptInfluence);
  const [communication, setCommunication] = useState(initialState.communication);
  const [ideaModification, setIdeaModification] = useState(initialState.ideaModification);

  const handleSkillChange = (category, skill) => {
    setSkillImprovement(prev => ({
      ...prev,
      [category]: prev[category].includes(skill)
        ? prev[category].filter(item => item !== skill)
        : [...prev[category], skill]
    }));
  };

  const handleOtherSkillsChange = (value) => {
    setSkillImprovement(prev => ({
      ...prev,
      otherSkills: value
    }));
  };

  const resetForm = () => {
    setSkillImprovement(initialState.skillImprovement);
    setGptInfluence(initialState.gptInfluence);
    setCommunication(initialState.communication);
    setIdeaModification(initialState.ideaModification);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    onSubmit({ 
      skillImprovement, 
      gptInfluence, 
      communication,
      ideaModification 
    });
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Reflection</h2>
        <form onSubmit={handleModalSubmit}>
          <div className="modal-section">
            <h3>Skills Improvement</h3>
            
            <div className="skill-category">
              <h4>Entrepreneurial Thinking</h4>
              <div className="skill-options">
                <label>
                  <input
                    type="checkbox"
                    checked={skillImprovement.entrepreneurialThinking.includes('Innovative Thinking')}
                    onChange={() => handleSkillChange('entrepreneurialThinking', 'Innovative Thinking')}
                  />
                  Innovative Thinking
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={skillImprovement.entrepreneurialThinking.includes('Opportunity Recognition')}
                    onChange={() => handleSkillChange('entrepreneurialThinking', 'Opportunity Recognition')}
                  />
                  Opportunity Recognition
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={skillImprovement.entrepreneurialThinking.includes('Critical Thinking')}
                    onChange={() => handleSkillChange('entrepreneurialThinking', 'Critical Thinking')}
                  />
                  Critical Thinking
                </label>
              </div>
            </div>

            <div className="skill-category">
              <h4>Entrepreneurial Spirit</h4>
              <div className="skill-options">
                {[
                  'Achievement Drive',
                  'Self-Efficacy',
                  'Innovation',
                  'Stress Tolerance',
                  'Risk-Taking',
                  'Proactiveness',
                  'Ambition'
                ].map(skill => (
                  <label key={skill}>
                    <input
                      type="checkbox"
                      checked={skillImprovement.entrepreneurialSpirit.includes(skill)}
                      onChange={() => handleSkillChange('entrepreneurialSpirit', skill)}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>

            <div className="skill-category">
              <h4>Entrepreneurial Skills</h4>
              <div className="skill-options">
                {[
                  'Leadership & Decision Making',
                  'Organization & Execution',
                  'Support & Cooperation',
                  'Analysis & Expression',
                  'Communication & Networking',
                  'Resource Integration',
                  'Risk Management',
                  'Financial Knowledge',
                  'Market & Sales'
                ].map(skill => (
                  <label key={skill}>
                    <input
                      type="checkbox"
                      checked={skillImprovement.entrepreneurialSkills.includes(skill)}
                      onChange={() => handleSkillChange('entrepreneurialSkills', skill)}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>

            <div className="skill-category">
              <h4>Other Skills Improvement</h4>
              <textarea
                value={skillImprovement.otherSkills}
                onChange={(e) => handleOtherSkillsChange(e.target.value)}
                placeholder="Please describe other skills improvement..."
              />
            </div>
          </div>

          <div className="modal-section">
            <h3>GPT's Influence</h3>
            <textarea
              value={gptInfluence}
              onChange={(e) => setGptInfluence(e.target.value)}
              placeholder="How did GPT's responses influence your ideas?"
            />
          </div>
          <div className="modal-section">
            <h3>Communication Reflection</h3>
            <textarea
              value={communication}
              onChange={(e) => setCommunication(e.target.value)}
              placeholder="What are your thoughts on the communication with GPT?"
            />
          </div>
          <div className="modal-section">
            <h3>Idea Modification</h3>
            <div className="idea-modification">
              <p>Do you want to modify your idea based on the communication?</p>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="hasModification"
                    checked={!ideaModification.hasModification}
                    onChange={() => setIdeaModification({
                      hasModification: false,
                      modifiedIdea: ''
                    })}
                  />
                  No
                </label>
                <label>
                  <input
                    type="radio"
                    name="hasModification"
                    checked={ideaModification.hasModification}
                    onChange={() => setIdeaModification(prev => ({
                      ...prev,
                      hasModification: true
                    }))}
                  />
                  Yes
                </label>
              </div>
              {ideaModification.hasModification && (
                <textarea
                  value={ideaModification.modifiedIdea}
                  onChange={(e) => setIdeaModification(prev => ({
                    ...prev,
                    modifiedIdea: e.target.value
                  }))}
                  placeholder="Enter your modified idea here..."
                  className="idea-modification-input"
                />
              )}
            </div>
          </div>
          <div className="modal-buttons">
            <button type="submit" className="submit-btn">Submit</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add GuidanceModal component
const GuidanceModal = ({ isOpen, onClose, section }) => {
  if (!isOpen) return null;

  const getGuidanceContent = () => {
    switch (section) {
      case 'idea':
        return {
          title: 'Guidance & Examples',
          content: `1. You can input your business idea in the Horizontal line.

2. Select any text and right-click to ask for AI assistant's opinion.

Examples:
1. "A mobile app that helps elderly people manage their medications"
2. "An AI-powered platform for personalizing student learning paths"
3. "A sustainable food delivery service using reusable containers"`
        };
      case 'painpoint':
        return {
          title: 'Pain Point Analysis Guidance',
          content: `1. From the user's perspective, through research and feedback, accurately identify the specific problems and unmet needs of target customers in existing products or services.

2. Pain points of smart fitness equipment: Traditional fitness methods lack personalized guidance, which makes it difficult for users to stick to them and the results are poor; at the same time, offline gyms are limited in time and space and cannot meet the fitness needs of busy office workers.

Key Points:
• Describe the specific problem
• Explain who experiences this problem
• Quantify the impact of the problem
• Show why existing solutions are inadequate

Examples:
1. "40% of elderly patients miss their medication schedules"
2. "Students struggle with one-size-fits-all learning approaches"
3. "Current food delivery creates excessive packaging waste"`
        };
      case 'market':
        return {
          title: 'Market Analysis Guidance',
          content: `1. Accurately identify target customer groups, analyze their preferences and purchasing behaviors, and evaluate market size and growth potential.

2. Healthy food startups: The target market is young office workers who pay attention to health. The market size is growing rapidly, and plant-based and personalized nutrition trends are obvious.

Key Points:
• Define your target market size
• Identify customer segments
• Analyze market trends
• Assess market growth potential

Examples:
1. "The global elderly care market is projected to reach $2.5 trillion by 2030"
2. "EdTech market growing at 16.3% CAGR"
3. "78% of consumers prefer eco-friendly businesses"`
        };
      case 'product':
        return {
          title: 'Product Introduction Guidance',
          content: `1. Clearly describe the core functions of the product, target users, and how it solves market pain points, highlighting unique value and differentiated features.

2. Smart fitness equipment: This is a smart fitness device for home users. It provides personalized fitness plans through AI technology to solve the pain point of users' lack of professional guidance. Its innovative sensor technology and intelligent algorithms are core competitiveness.

Key Points:
• Core features and benefits
• Unique selling points
• How it solves the pain point
• Technical feasibility

Examples:
1. "Smart pill dispenser with mobile app integration"
2. "AI algorithm that adapts to individual learning styles"
3. "IoT-enabled reusable container system"`
        };
      case 'competitive':
        return {
          title: 'Competitive Analysis Guidance',
          content: `1. Identify competitors and their strengths and weaknesses, analyze their products, market share, competitive strengths and weaknesses, and identify opportunities for differentiation.

2. Smart fitness equipment: The main competitors are large fitness equipment brands and emerging technology fitness companies. Large brands have brand awareness and channel advantages, but lack product innovation; emerging companies focus on innovation but have a small market share. Entry barriers include technology research and development and brand building, and differentiation opportunities lie in AI personalized services.

Key Points:
• Identify direct and indirect competitors
• Compare key features
• Highlight your advantages
• Market positioning

Examples:
1. "Comparison with traditional pill boxes and reminder apps"
2. "Analysis of existing learning platforms"
3. "Differentiation from standard delivery services"`
        };
      case 'feasibility':
        return {
          title: 'Feasibility Analysis Guidance',
          content: `1. Analyze whether the technology required to realize the product or service is mature, whether the resources are available, and whether the team has the relevant capabilities.

2. Smart fitness equipment: Technically, the current AI and sensor technologies are mature and can realize personalized fitness guidance; in the market, there is a strong demand for fitness, the target user group is large and has a high willingness to pay; financially, the cost is controllable and it is expected to achieve profitability within two years.

Key Points:
• Technical requirements
• Resource needs
• Operational processes
• Risk assessment

Examples:
1. "IoT device manufacturing and app development requirements"
2. "AI model training and data requirements"
3. "Container logistics and cleaning facility needs"`
        };
      case 'financial':
        return {
          title: 'Financial Planning Guidance',
          content: `1. Clarify the initial investment needs, including equipment, personnel, marketing and other costs, formulate revenue, cost and profit forecasts for the next 3-5 years, and ensure that the financial model is reasonable and feasible.

2. Smart fitness equipment: The initial investment is 1 million yuan for R&D and equipment procurement, with an estimated revenue of 2 million yuan in the first year and profitability in the second year, with a return on investment of 30%, and a break-even point in the middle of the second year.

Key Points:
• Initial investment needed
• Revenue model
• Cost structure
• Break-even analysis

Examples:
1. "Hardware costs, app development, marketing budget"
2. "Subscription model, development costs, scaling plan"
3. "Container costs, delivery infrastructure, operational expenses"`
        };
      case 'team':
        return {
          title: 'Team Introduction Guidance',
          content: `1. Show the professional skills, work experience and successful cases of team members in related fields, and emphasize the complementarity and collaboration of the team.

2. Smart Fitness Equipment Team: The core team members include a senior fitness equipment engineer, an AI algorithm expert and a marketing director. They have more than 10 years of experience in fitness equipment research and development, smart technology application and marketing promotion, and have successfully launched a number of best-selling fitness products.

Key Points:
• Key team members
• Relevant experience
• Roles and responsibilities
• Required future hires

Examples:
1. "Healthcare technology experience, IoT development skills"
2. "AI expertise, education sector background"
3. "Logistics experience, sustainability credentials"`
        };
      case 'pitching':
        return {
          title: 'Pitching Guidance',
          content: `1. In a limited time, clearly and concisely convey your business ideas, product advantages and market potential, focusing on solving pain points and unique selling points.

2. Smart fitness equipment roadshow: The opening story tells a story about an office worker who has difficulty sticking to exercise due to lack of fitness guidance, and introduces how our smart fitness equipment can provide personalized guidance through AI technology to help users easily achieve their fitness goals. Finally, call on investors to join in and jointly promote the popularization of a healthy lifestyle.

Key Points:
• Clear value proposition
• Market opportunity
• Business model
• Growth strategy

Examples:
1. "30-second elevator pitch"
2. "5-minute investor presentation"
3. "Detailed stakeholder proposal"`
        };
      default:
        return {
          title: 'Guidance & Examples',
          content: 'Please proceed with your work in this section.'
        };
    }
  };

  const guidance = getGuidanceContent();

  return (
    <div className="modal-overlay">
      <div className="modal-content guidance-modal">
        <h2>{guidance.title}</h2>
        <div className="guidance-content">
          <pre>{guidance.content}</pre>
        </div>
        <div className="modal-buttons">
          <button className="submit-btn" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentSection, setCurrentSection] = useState('idea');
  const [currentBPSection, setCurrentBPSection] = useState(null); // Initially no BP section is selected
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [content, setContent] = useState('');  // Global editor box content
  const [ideaInput, setIdeaInput] = useState('');  // New state for idea input
  const [ideaVersions, setIdeaVersions] = useState([]); // New state for idea versions history (hidden)
  const [isIdeaConfirmed, setIsIdeaConfirmed] = useState(false); // New state for idea confirmation status
  const [hasCommunicated, setHasCommunicated] = useState(false);
  const [hasReflected, setHasReflected] = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [reflections, setReflections] = useState([]);
  const [completedSections, setCompletedSections] = useState([]);
  const [bpSections] = useState([
    { id: 'painpoint', name: 'Pain Point', order: 1 },
    { id: 'market', name: 'Market Analysis', order: 2 },
    { id: 'product', name: 'Product Introduction', order: 3 },
    { id: 'competitive', name: 'Competitive Analysis', order: 4 },
    { id: 'feasibility', name: 'Feasibility Analysis', order: 5 },
    { id: 'financial', name: 'Financial Planning', order: 6 },
    { id: 'team', name: 'Team Introduction', order: 7 }
  ]);
  const [isBPExpanded, setIsBPExpanded] = useState(true);  // Add expand/collapse state
  const [selectedText, setSelectedText] = useState('');
  const [floatingButton, setFloatingButton] = useState({ show: false, x: 0, y: 0 });
  const [showGuidance, setShowGuidance] = useState(true);
  const [currentGuidanceSection, setCurrentGuidanceSection] = useState('idea');

  // Replace single content state with section-specific content states
  const [ideaContent, setIdeaContent] = useState({
    text: '',
    timestamp: null,
    isConfirmed: false,
    displayText: ''
  });
  
  const [bpContents, setBpContents] = useState({
    painpoint: { text: '', timestamp: null },
    market: { text: '', timestamp: null },
    product: { text: '', timestamp: null },
    competitive: { text: '', timestamp: null },
    feasibility: { text: '', timestamp: null },
    financial: { text: '', timestamp: null },
    team: { text: '', timestamp: null }
  });

  const [pitchingContent, setPitchingContent] = useState({
    text: '',
    timestamp: null
  });

  // Add sectionContent state
  const [sectionContent, setSectionContent] = useState({
    painpoint: '',
    product: '',
    market: '',
    business: '',
    competitive: '',
    feasibility: '',
    financial: '',
    team: '',
    pitching: ''
  });

  // Add a ref for the root element
  const appRef = useRef(null);

  const [chatAgent] = useState(new ChatAgent());
  const [nextStepSuggestion, setNextStepSuggestion] = useState('');

  // Update setCurrentSection to include ChatAgent context
  const updateCurrentSection = (section, subsection = null) => {
    setCurrentSection(section);
    if (subsection) {
      setCurrentBPSection(subsection);
    }
    chatAgent.setContext(section, subsection);
    setNextStepSuggestion(chatAgent.generateNextStepSuggestion());
  };

  // Update handleSendMessage to use ChatAgent
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      // Add user message to chat and history
      const userMessage = inputMessage;
      setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
      chatAgent.addToHistory(userMessage, 'user');
      
      try {
        // Build prompt using ChatAgent
        const prompt = chatAgent.buildPrompt(
          userMessage,
          currentSection === 'bpwriting' ? currentBPSection : currentSection
        );

        const response = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: prompt,
            section: currentSection === 'bpwriting' ? currentBPSection : currentSection,
            formatting: {
              avoidSpecialCharacters: true,
              useNumberedLists: false,
              maxPoints: 2,
              useParagraphBreaks: true,
              removeSymbols: true
            }
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          // Process response using ChatAgent
          const cleanResponse = chatAgent.processResponse(data.response);
          
          // Add AI response to chat and history
          setMessages(prev => [...prev, { text: cleanResponse, sender: 'ai' }]);
          chatAgent.addToHistory(cleanResponse, 'ai');

          // Update next step suggestion
          setNextStepSuggestion(chatAgent.generateNextStepSuggestion());

          // Check if we should summarize the conversation
          if (chatAgent.shouldSummarizeConversation()) {
            const summary = chatAgent.summarizeConversation();
            setMessages(prev => [...prev, { 
              text: summary, 
              sender: 'ai',
              type: 'summary'
            }]);
          }
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = 'Sorry, there was an error processing your request. Please try again.';
        setMessages(prev => [...prev, { text: errorMessage, sender: 'ai' }]);
        chatAgent.addToHistory(errorMessage, 'ai');
      }
      
      setInputMessage('');
    }
  };

  // Function to get current section's content
  const getCurrentContent = () => {
    if (currentSection === 'bpwriting' && currentBPSection) {
      return sectionContent[currentBPSection] || '';
    } else if (currentSection === 'pitching') {
      return sectionContent.pitching || '';
    }
    return '';
  };

  // Function to update current section's content
  const handleContentChange = (e) => {
    const newText = e.target.value;
    
    if (currentSection === 'idea') {
      setIdeaContent(prev => ({
        ...prev,
        text: newText
      }));
    } else if (currentSection === 'bpwriting' && currentBPSection) {
      setSectionContent(prev => ({
        ...prev,
        [currentBPSection]: newText
      }));
      // Also update bpContents for tracking timestamps
      setBpContents(prev => ({
        ...prev,
        [currentBPSection]: {
          text: newText,
          timestamp: new Date().toLocaleString()
        }
      }));
    } else if (currentSection === 'pitching') {
      setPitchingContent({
        text: newText,
        timestamp: new Date().toLocaleString()
      });
    }
  };

  const handleAddContent = (type) => {
    let newContent = '';
    switch(type) {
      case 'idea':
        newContent = '<div class="added-content">IDEA:</div>\n\n';
        break;
      case 'painpoint':
        newContent = '<div class="added-content">PAIN POINT:</div>\n\n';
        break;
      case 'market':
        newContent = '<div class="added-content">MARKET ANALYSIS:</div>\n\n';
        break;
      case 'product':
        newContent = '<div class="added-content">PRODUCT INTRODUCTION:</div>\n\n';
        break;
      case 'competitive':
        newContent = '<div class="added-content">COMPETITIVE ANALYSIS:</div>\n\n';
        break;
      case 'feasibility':
        newContent = '<div class="added-content">FEASIBILITY ANALYSIS:</div>\n\n';
        break;
      case 'financial':
        newContent = '<div class="added-content">FINANCIAL PLANNING:</div>\n\n';
        break;
      case 'team':
        newContent = '<div class="added-content">TEAM INTRODUCTION:</div>\n\n';
        break;
      default:
        newContent = '';
    }
    setContent(content + newContent);
  };

  const renderGuidance = () => {
    switch(currentSection) {
      case 'idea':
        return "1. You can input your business idea in the Horizontal line.\n\n2. Select any text and right-click to ask for AI assistant's opinion.";
      case 'bpwriting':
        switch(currentBPSection) {
          case 'painpoint':
            return "1. From the user's perspective, through research and feedback, accurately identify the specific problems and unmet needs of target customers in existing products or services.\n\n2. Pain points of smart fitness equipment: Traditional fitness methods lack personalized guidance, which makes it difficult for users to stick to them and the results are poor; at the same time, offline gyms are limited in time and space and cannot meet the fitness needs of busy office workers.";
          case 'market':
            return "1. Accurately identify target customer groups, analyze their preferences and purchasing behaviors, and evaluate market size and growth potential.\n\n2. Healthy food startups: The target market is young office workers who pay attention to health. The market size is growing rapidly, and plant-based and personalized nutrition trends are obvious.";
          case 'product':
            return "1. Clearly describe the core functions of the product, target users, and how it solves market pain points, highlighting unique value and differentiated features.\n\n2. Smart fitness equipment: This is a smart fitness device for home users. It provides personalized fitness plans through AI technology to solve the pain point of users' lack of professional guidance. Its innovative sensor technology and intelligent algorithms are core competitiveness.";
          case 'competitive':
            return "1. Identify competitors and their strengths and weaknesses, analyze their products, market share, competitive strengths and weaknesses, and identify opportunities for differentiation.\n\n2. Smart fitness equipment: The main competitors are large fitness equipment brands and emerging technology fitness companies. Large brands have brand awareness and channel advantages, but lack product innovation; emerging companies focus on innovation but have a small market share. Entry barriers include technology research and development and brand building, and differentiation opportunities lie in AI personalized services.";
          case 'feasibility':
            return "1. Analyze whether the technology required to realize the product or service is mature, whether the resources are available, and whether the team has the relevant capabilities.\n\n2. Smart fitness equipment: Technically, the current AI and sensor technologies are mature and can realize personalized fitness guidance; in the market, there is a strong demand for fitness, the target user group is large and has a high willingness to pay; financially, the cost is controllable and it is expected to achieve profitability within two years.";
          case 'financial':
            return "1. Clarify the initial investment needs, including equipment, personnel, marketing and other costs, formulate revenue, cost and profit forecasts for the next 3-5 years, and ensure that the financial model is reasonable and feasible.\n\n2. Smart fitness equipment: The initial investment is 1 million yuan for R&D and equipment procurement, with an estimated revenue of 2 million yuan in the first year and profitability in the second year, with a return on investment of 30%, and a break-even point in the middle of the second year.";
          case 'team':
            return "1. Show the professional skills, work experience and successful cases of team members in related fields, and emphasize the complementarity and collaboration of the team.\n\n2. Smart Fitness Equipment Team: The core team members include a senior fitness equipment engineer, an AI algorithm expert and a marketing director. They have more than 10 years of experience in fitness equipment research and development, smart technology application and marketing promotion, and have successfully launched a number of best-selling fitness products.";
          default:
            return "Select a section from the left navigation to view guidance.";
        }
      case 'pitching':
        return "1. In a limited time, clearly and concisely convey your business ideas, product advantages and market potential, focusing on solving pain points and unique selling points.\n\n2. Smart fitness equipment roadshow: The opening story tells a story about an office worker who has difficulty sticking to exercise due to lack of fitness guidance, and introduces how our smart fitness equipment can provide personalized guidance through AI technology to help users easily achieve their fitness goals. Finally, call on investors to join in and jointly promote the popularization of a healthy lifestyle.";
      default:
        return "Select a section from the left navigation to view guidance.";
    }
  };

  // Update handleCommunicate to use ChatAgent
  const handleCommunicate = async () => {
    if (selectedText) {
      // Add user selection to chat and history
      setMessages(prev => [...prev, { text: selectedText, sender: 'user' }]);
      chatAgent.addToHistory(selectedText, 'user');
      
      try {
        // Build prompt using ChatAgent
        const prompt = chatAgent.buildPrompt(
          selectedText,
          currentSection === 'bpwriting' ? currentBPSection : currentSection,
          selectedText
        );

        const response = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: prompt,
            section: currentSection === 'bpwriting' ? currentBPSection : currentSection,
            formatting: {
              avoidSpecialCharacters: true,
              useNumberedLists: false,
              maxPoints: 2,
              useParagraphBreaks: true,
              removeSymbols: true
            }
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          // Process response using ChatAgent
          const cleanResponse = chatAgent.processResponse(data.response);
          
          // Add AI response to chat and history
          setMessages(prev => [...prev, { text: cleanResponse, sender: 'ai' }]);
          chatAgent.addToHistory(cleanResponse, 'ai');

          // Update next step suggestion
          setNextStepSuggestion(chatAgent.generateNextStepSuggestion());

          // Set communication status
          setHasCommunicated(true);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = 'Sorry, there was an error processing your request. Please try again.';
        setMessages(prev => [...prev, { text: errorMessage, sender: 'ai' }]);
        chatAgent.addToHistory(errorMessage, 'ai');
      }
    }
    setFloatingButton({ show: false, x: 0, y: 0 });
  };

  // Helper function to get section-specific prompting context
  const getSectionSpecificPrompt = (section, bpSection) => {
    if (section === 'idea') {
      return `For business ideas analysis and discussion:
        Key Analysis Points:
        - Market need and problem-solution fit
        - Innovation and uniqueness
        - Target market size and potential
        - Initial feasibility

        Discussion Topics:
        - How might the idea evolve to better address market needs?
        - What are potential pivots or expansions of this idea?
        - How does this compare to existing solutions?
        - What are the key assumptions that need validation?`;
    }

    switch (bpSection) {
      case 'painpoint':
        return `For pain point analysis and discussion:
          Key Analysis Points:
          - Problem severity and urgency
          - Target customer impact
          - Existing solution gaps
          - Market research validation

          Discussion Topics:
          - How do customers currently solve this problem?
          - What are the hidden costs or impacts of this pain point?
          - Which customer segments feel this pain most acutely?
          - What validation methods could strengthen this analysis?
          - How might this pain point evolve in the future?`;

      case 'market':
        return `For market analysis and discussion:
          Key Analysis Points:
          - Market size and growth potential
          - Customer segmentation
          - Market trends and dynamics
          - Competition landscape

          Discussion Topics:
          - What are emerging trends that could impact this market?
          - How might customer needs evolve?
          - What are potential market entry strategies?
          - How can we validate market size assumptions?
          - What adjacent markets might be relevant?`;

      case 'product':
        return `For product discussion and development:
          Key Analysis Points:
          - Value proposition
          - Key features and benefits
          - Technical feasibility
          - Competitive advantages

          Discussion Topics:
          - How can the product evolve over time?
          - What features might be added in future iterations?
          - How does this align with user needs?
          - What technical challenges need to be addressed?
          - How can we maintain competitive advantage?`;

      case 'competitive':
        return `For competitive analysis and discussion:
          Key Analysis Points:
          - Competitor strengths/weaknesses
          - Market positioning
          - Entry barriers
          - Competitive advantages

          Discussion Topics:
          - How might competitors respond to market entry?
          - What are potential defensive strategies?
          - How can we create sustainable advantages?
          - What partnerships might strengthen our position?
          - How might the competitive landscape evolve?`;

      case 'feasibility':
        return `For feasibility analysis and discussion:
          Key Analysis Points:
          - Technical requirements
          - Resource availability
          - Implementation challenges
          - Risk factors

          Discussion Topics:
          - What are critical success factors?
          - How can we mitigate key risks?
          - What alternative approaches might work?
          - How can we test assumptions?
          - What partnerships or resources might help?`;

      case 'financial':
        return `For financial planning and discussion:
          Key Analysis Points:
          - Revenue model
          - Cost structure
          - Funding requirements
          - Financial projections

          Discussion Topics:
          - What are alternative revenue streams?
          - How can we optimize the cost structure?
          - What are key financial risks and mitigations?
          - How might unit economics improve at scale?
          - What funding strategies should we consider?`;

      case 'team':
        return `For team analysis and discussion:
          Key Analysis Points:
          - Skills and experience
          - Role alignment
          - Team completeness
          - Leadership capabilities

          Discussion Topics:
          - What additional roles might be needed?
          - How can we address skill gaps?
          - What organizational structure would work best?
          - How should the team evolve as we grow?
          - What advisory support might be valuable?`;

      default:
        return '';
    }
  };

  const handleReflection = () => {
    setIsReflectionModalOpen(true);
  };

  const handleReflectionSubmit = async (reflectionData) => {
    const reflection = {
      ...reflectionData,
      timestamp: new Date().toLocaleString(),
      section: currentSection === 'bpwriting' ? currentBPSection : currentSection
    };

    // If there's a modified idea, update the idea content first
    if (reflection.ideaModification.hasModification && reflection.ideaModification.modifiedIdea.trim()) {
      const timestamp = new Date().toLocaleString();
      const newIdea = reflection.ideaModification.modifiedIdea.trim();
      
      // Update the idea content
      setIdeaContent(prev => {
        const newDisplayText = prev.displayText 
          ? `${prev.displayText}\n\nModified Idea (${timestamp}):\n${newIdea}`
          : `Initial Idea (${timestamp}):\n${newIdea}`;

        return {
          text: newIdea,
          displayText: newDisplayText,
          timestamp: timestamp,
          isConfirmed: true
        };
      });
    }

    try {
      // Save reflection to backend
      const response = await fetch('http://localhost:5000/api/reflections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(reflection)
      });

      if (!response.ok) {
        throw new Error('Failed to save reflection');
      }

      // Update local state
      setReflections(prev => [...prev, reflection]);
      setHasReflected(true);
      
      // Close the modal after all updates are done
      setIsReflectionModalOpen(false);
    } catch (error) {
      console.error('Error saving reflection:', error);
      // Even if saving to backend fails, we still want to update local state
      setReflections(prev => [...prev, reflection]);
      setHasReflected(true);
      setIsReflectionModalOpen(false);
    }
  };

  const handleIdeaConfirm = () => {
    if (ideaContent.text.trim()) {
      const timestamp = new Date().toLocaleString();
      setIdeaContent(prev => {
        const newDisplayText = prev.isConfirmed 
          ? prev.text  // If already confirmed and clicking to revise, just show the text
          : `Initial Idea (${timestamp}):\n${prev.text}`;  // If confirming, show with timestamp
        
        return {
          ...prev,
          isConfirmed: !prev.isConfirmed,
          timestamp: timestamp,
          displayText: newDisplayText
        };
      });
    }
  };

  const handleNextStep = () => {
    // For idea section, require both confirmation and reflection
    if (currentSection === 'idea' && (!ideaContent.isConfirmed || !hasReflected)) {
      return;
    }
    
    // For all other sections (including pitching), require communication and reflection
    if (!hasCommunicated || !hasReflected) {
      return;
    }

    if (currentSection === 'pitching') {
      generateReport();
    } else {
      setCompletedSections(prev => [...prev, currentSection === 'bpwriting' ? currentBPSection : currentSection]);
      setHasCommunicated(false);
      setHasReflected(false);
      setSelectedText('');
      setFloatingButton({ show: false, x: 0, y: 0 });

      if (currentSection === 'idea') {
        setCurrentSection('bpwriting');
        setCurrentBPSection('painpoint');
        setIsBPExpanded(true);
        setShowGuidance(true);
        setCurrentGuidanceSection('painpoint');
      } else if (currentSection === 'bpwriting') {
        const currentIndex = bpSections.findIndex(section => section.id === currentBPSection);
        if (currentBPSection === 'team') {
          setCurrentSection('pitching');
          setCurrentBPSection(null);
          setShowGuidance(true);
          setCurrentGuidanceSection('pitching');
        } else if (currentIndex < bpSections.length - 1) {
          const nextSection = bpSections[currentIndex + 1];
          setCurrentBPSection(nextSection.id);
          setShowGuidance(true);
          setCurrentGuidanceSection(nextSection.id);
        }
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentSection === 'bpwriting') {
      if (currentBPSection === 'painpoint') {
        // If we're at painpoint, go back to idea
        setCurrentSection('idea');
        setCurrentBPSection(null);
      } else {
        // Find the previous BP section
        const currentIndex = bpSections.findIndex(section => section.id === currentBPSection);
        if (currentIndex > 0) {
          const previousSection = bpSections[currentIndex - 1];
          setCurrentBPSection(previousSection.id);
        }
      }
    } else if (currentSection === 'pitching') {
      // If we're at pitching, go back to team
      setCurrentSection('bpwriting');
      setCurrentBPSection('team');
    } else if (currentSection === 'idea') {
      // If we're at idea, this is the first section, do nothing or show a message
      return;
    }
    
    // Reset states for new section
    setHasCommunicated(false);
    setHasReflected(false);
    setSelectedText('');
    setFloatingButton({ show: false, x: 0, y: 0 });
  };

  const generateReport = () => {
    let reportContent = `Business Plan Development Report\n`;
    reportContent += `Generated on: ${new Date().toLocaleString()}\n\n`;

    // Add idea section
    reportContent += `1. Idea\n`;
    reportContent += `====================\n`;
    reportContent += `Content: ${ideaContent.text}\n`;
    reportContent += `Confirmed: ${ideaContent.isConfirmed ? 'Yes' : 'No'}\n`;
    reportContent += `Last Modified: ${ideaContent.timestamp}\n\n`;

    // Add business plan sections
    reportContent += `2. Business Plan Content\n`;
    reportContent += `====================\n\n`;
    Object.entries(bpContents).forEach(([section, content]) => {
      const sectionName = bpSections.find(s => s.id === section)?.name || section;
      reportContent += `${sectionName}\n`;
      reportContent += `--------------------\n`;
      reportContent += `Content: ${content.text}\n`;
      reportContent += `Last Modified: ${content.timestamp}\n\n`;
    });

    // Add pitching section
    reportContent += `3. Pitching\n`;
    reportContent += `====================\n`;
    reportContent += `Content: ${pitchingContent.text}\n`;
    reportContent += `Last Modified: ${pitchingContent.timestamp}\n\n`;

    // Add reflections section
    reportContent += `4. Learning Reflections\n`;
    reportContent += `====================\n\n`;
    reflections.forEach((reflection, index) => {
      reportContent += `Reflection ${index + 1} (${reflection.timestamp})\n`;
      reportContent += `Section: ${reflection.section}\n\n`;
      
      // Skills Improvement
      reportContent += `Skills Development:\n`;
      if (reflection.skillImprovement.entrepreneurialThinking.length > 0) {
        reportContent += `- Entrepreneurial Thinking: ${reflection.skillImprovement.entrepreneurialThinking.join(', ')}\n`;
      }
      if (reflection.skillImprovement.entrepreneurialSpirit.length > 0) {
        reportContent += `- Entrepreneurial Spirit: ${reflection.skillImprovement.entrepreneurialSpirit.join(', ')}\n`;
      }
      if (reflection.skillImprovement.entrepreneurialSkills.length > 0) {
        reportContent += `- Entrepreneurial Skills: ${reflection.skillImprovement.entrepreneurialSkills.join(', ')}\n`;
      }
      if (reflection.skillImprovement.otherSkills) {
        reportContent += `- Other Skills: ${reflection.skillImprovement.otherSkills}\n`;
      }
      
      reportContent += `\nGPT's Influence:\n${reflection.gptInfluence}\n\n`;
      reportContent += `Communication Reflection:\n${reflection.communication}\n\n`;
    });

    // Create and download the report file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business_plan_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Function to check if a section should be highlighted
  const isSectionActive = (sectionId) => {
    if (currentSection === 'idea' && sectionId === 'idea') {
      return true;
    }
    if (currentSection === 'bpwriting' && sectionId === currentBPSection) {
      return true;
    }
    if (currentSection === 'pitching' && sectionId === 'pitching') {
      return true;
    }
    return false;
  };

  // Function to check if a section should be shown as completed
  const isSectionCompleted = (sectionId) => {
    return completedSections.includes(sectionId);
  };

  // Function to get current section title
  const getCurrentSectionTitle = () => {
    if (currentSection === 'idea') {
      return 'IDEA';
    } else if (currentSection === 'bpwriting' && currentBPSection) {
      const section = bpSections.find(s => s.id === currentBPSection);
      return section ? section.name.toUpperCase() : '';
    } else if (currentSection === 'pitching') {
      return 'PITCHING';
    }
    return '';
  };

  const getPitchingContent = () => {
    let combinedContent = '';
    
    // Add Pain Point content
    if (sectionContent.painpoint) {
      combinedContent += `PAIN POINT\n${sectionContent.painpoint}\n\n`;
    }

    // Add Market Analysis content
    if (sectionContent.market) {
      combinedContent += `MARKET ANALYSIS\n${sectionContent.market}\n\n`;
    }

    // Add Product Introduction content
    if (sectionContent.product) {
      combinedContent += `PRODUCT INTRODUCTION\n${sectionContent.product}\n\n`;
    }

    // Add Competitive Analysis content
    if (sectionContent.competitive) {
      combinedContent += `COMPETITIVE ANALYSIS\n${sectionContent.competitive}\n\n`;
    }

    // Add Feasibility Analysis content
    if (sectionContent.feasibility) {
      combinedContent += `FEASIBILITY ANALYSIS\n${sectionContent.feasibility}\n\n`;
    }

    // Add Financial Planning content
    if (sectionContent.financial) {
      combinedContent += `FINANCIAL PLANNING\n${sectionContent.financial}\n\n`;
    }

    // Add Team Introduction content
    if (sectionContent.team) {
      combinedContent += `TEAM INTRODUCTION\n${sectionContent.team}\n\n`;
    }

    return combinedContent;
  };

  return (
    <div className="App" ref={appRef}>
      <div className="app-container">
        <div className="left-sidebar">
          <h2 className="sidebar-title">Outline</h2>
          <nav className="main-nav">
            <div className="nav-item-container">
              <div 
                className={`main-nav-item ${isSectionActive('idea') ? 'active' : ''} ${isSectionCompleted('idea') ? 'completed' : ''}`}
              >
                <div className="nav-item-content">
                  <img src={ideaIcon} alt="idea" className="nav-icon" />
                  <span>Idea</span>
                </div>
              </div>
            </div>

            <div 
              className={`main-nav-item bp-writing ${currentSection === 'bpwriting' ? 'active' : ''}`}
            >
              <div className="nav-item-content">
                <img src={writingIcon} alt="writing" className="nav-icon" />
                <span>BP Writing</span>
              </div>
              <div className="nav-right-icons">
                <span>{isBPExpanded ? '▼' : '▶'}</span>
              </div>
            </div>
            {isBPExpanded && (
              <div className="bp-content">
                <div className="bp-nav">
                  {bpSections.map((section) => (
                    <div key={section.id} className="bp-nav-item-container">
                      <div className="order-number">{section.order}</div>
                      <div 
                        className={`bp-nav-item ${isSectionActive(section.id) ? 'active' : ''} ${isSectionCompleted(section.id) ? 'completed' : ''}`}
                      >
                        {section.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="nav-item-container">
              <div 
                className={`main-nav-item ${isSectionActive('pitching') ? 'active' : ''} ${isSectionCompleted('pitching') ? 'completed' : ''}`}
              >
                <div className="nav-item-content">
                  <img src={pitchingIcon} alt="pitching" className="nav-icon" />
                  <span>Pitching</span>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="content-area">
          <div className="content-wrapper">
            <div className="editor-section">
              <div className="editor-header">
                <div className="editor-title">
                  <img src={txtIcon} alt="document" className="editor-icon" />
                  <span>Idea:</span>
                  {currentSection === 'idea' ? (
                    <div className="idea-input-container">
                      <input
                        type="text"
                        className={`idea-input ${ideaContent.isConfirmed ? 'confirmed' : ''}`}
                        value={ideaContent.text}
                        onChange={(e) => setIdeaContent(prev => ({
                          ...prev,
                          text: e.target.value
                        }))}
                        onMouseUp={(e) => {
                          const selection = window.getSelection();
                          const selectedText = selection.toString().trim();
                          if (!selectedText) {
                            setSelectedText('');
                            setFloatingButton({ show: false, x: 0, y: 0 });
                          }
                        }}
                        onSelect={(e) => {
                          const input = e.target;
                          const selection = window.getSelection();
                          const selectedText = selection.toString().trim();
                          
                          if (selectedText) {
                            const rect = input.getBoundingClientRect();
                            const x = rect.left + rect.width / 2;
                            const y = rect.top + 50;
                            
                            setSelectedText(selectedText);
                            setFloatingButton({
                              show: true,
                              x: x,
                              y: y
                            });
                          }
                        }}
                        onBlur={(e) => {
                          setTimeout(() => {
                            const activeElement = document.activeElement;
                            if (!activeElement.classList.contains('communicate-btn') && 
                                !activeElement.classList.contains('floating-communicate')) {
                              setSelectedText('');
                              setFloatingButton({ show: false, x: 0, y: 0 });
                            }
                          }, 100);
                        }}
                        placeholder="Write your idea here..."
                        readOnly={ideaContent.isConfirmed}
                      />
                      <button 
                        className={`idea-confirm-btn ${ideaContent.isConfirmed ? 'revise' : ''}`}
                        onClick={handleIdeaConfirm}
                      >
                        {ideaContent.isConfirmed ? 'Revise' : 'Confirm'}
                      </button>
                    </div>
                  ) : (
                    <div className="idea-display">
                      {ideaContent.text}
                    </div>
                  )}
                </div>
              </div>
              <div className="section-header">
                <h2>{getCurrentSectionTitle()}</h2>
              </div>
              <textarea
                className="document-editor"
                value={currentSection === 'idea' ? ideaContent.displayText : 
                       currentSection === 'pitching' ? getPitchingContent() : 
                       getCurrentContent()}
                onChange={handleContentChange}
                onMouseUp={(e) => {
                  const selection = window.getSelection();
                  const selectedText = selection.toString().trim();
                  if (!selectedText) {
                    setSelectedText('');
                    setFloatingButton({ show: false, x: 0, y: 0 });
                  }
                }}
                onSelect={(e) => {
                  const textarea = e.target;
                  const selection = window.getSelection();
                  const selectedText = selection.toString().trim();
                  
                  if (selectedText) {
                    const rect = textarea.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + 50;
                    
                    setSelectedText(selectedText);
                    setFloatingButton({
                      show: true,
                      x: x,
                      y: y
                    });
                  }
                }}
                onBlur={(e) => {
                  setTimeout(() => {
                    const activeElement = document.activeElement;
                    if (!activeElement.classList.contains('communicate-btn') && 
                        !activeElement.classList.contains('floating-communicate')) {
                      setSelectedText('');
                      setFloatingButton({ show: false, x: 0, y: 0 });
                    }
                  }, 100);
                }}
                onMouseLeave={(e) => {
                  const selection = window.getSelection();
                  const selectedText = selection.toString().trim();
                  if (!selectedText) {
                    setSelectedText('');
                    setFloatingButton({ show: false, x: 0, y: 0 });
                  }
                }}
                placeholder={currentSection === 'idea' ? "Your confirmed idea will appear here..." : "Write your content here..."}
                readOnly={currentSection === 'idea'}
              />
              <div className="editor-footer">
                <button 
                  className="footer-btn previous-btn"
                  onClick={handlePreviousStep}
                  disabled={currentSection === 'idea'}
                >
                  PREVIOUS STEP
                </button>
                <button 
                  className={`footer-btn communicate-btn ${selectedText ? 'active' : ''} ${hasCommunicated ? 'completed' : ''}`}
                  onClick={handleCommunicate}
                  disabled={!selectedText}
                >
                  COMMUNICATE
                </button>
                <button 
                  className={`footer-btn reflect-btn ${hasCommunicated ? 'active' : ''} ${hasReflected ? 'completed' : ''}`}
                  onClick={handleReflection}
                  disabled={!hasCommunicated}
                >
                  REFLECT
                </button>
                <button 
                  className={`footer-btn next-btn ${
                    currentSection === 'idea' 
                      ? (ideaContent.isConfirmed && hasReflected ? 'active' : '')
                      : (hasCommunicated && hasReflected ? 'active' : '')
                  }`}
                  onClick={handleNextStep}
                  disabled={
                    currentSection === 'idea'
                      ? (!hasReflected || !ideaContent.isConfirmed)
                      : (!hasCommunicated || !hasReflected)
                  }
                >
                  {currentSection === 'pitching' ? 'REPORT' : 'NEXT STEP'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="right-sidebar">
          <div className="guidance-panel">
            <h3>Guidance & Examples</h3>
            <p>{renderGuidance()}</p>
          </div>
          <div className="chat-section">
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${message.sender} ${message.type || ''}`}
                  dangerouslySetInnerHTML={{ __html: message.text }}
                />
              ))}
              {nextStepSuggestion && (
                <div className="message suggestion">
                  {nextStepSuggestion}
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask AI Assistant..."
                className="chat-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </div>
        </div>

        {/* Floating button at top level */}
        {floatingButton.show && (
          <button 
            className="floating-communicate"
            style={{ 
              position: 'fixed',
              left: `${floatingButton.x}px`,
              top: `${floatingButton.y}px`,
              transform: 'translate(-50%, 0)',
              zIndex: 999999,
              backgroundColor: '#1a73e8',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
            onClick={handleCommunicate}
          >
            Communicate
          </button>
        )}
      </div>
      <ReflectionModal
        isOpen={isReflectionModalOpen}
        onClose={() => setIsReflectionModalOpen(false)}
        onSubmit={handleReflectionSubmit}
      />
      <GuidanceModal 
        isOpen={showGuidance} 
        onClose={() => setShowGuidance(false)}
        section={currentGuidanceSection}
      />
    </div>
  );
}

export default App;
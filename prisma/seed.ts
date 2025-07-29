import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Prevent seeding in production
  if (process.env.NODE_ENV === 'production') {
    console.log('🚫 Seeding is disabled in production environment')
    process.exit(0)
  }

  console.log('🌱 Starting database seed...')

  // Create test users with more realistic data
  const users = [
    {
      email: 'john.doe@example.com',
      password: await bcrypt.hash('password123', 10),
      profile: {
        healthGoal: 'Lose 15 pounds and build muscle definition',
        dietaryPreferences: ['Vegetarian', 'Low Carb'],
        fitnessLevel: 'Intermediate',
        hasApiKey: false,
      }
    },
    {
      email: 'sarah.smith@example.com', 
      password: await bcrypt.hash('password123', 10),
      profile: {
        healthGoal: 'Train for a marathon and improve endurance',
        dietaryPreferences: ['Gluten-Free', 'High Protein'],
        fitnessLevel: 'Advanced',
        hasApiKey: false,
      }
    },
    {
      email: 'mike.wilson@example.com',
      password: await bcrypt.hash('password123', 10),
      profile: {
        healthGoal: 'Start a healthy lifestyle and lose weight',
        dietaryPreferences: [],
        fitnessLevel: 'Beginner',
        hasApiKey: false,
      }
    }
  ]

  const createdUsers = []
  
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: userData.password,
        profile: {
          create: userData.profile
        }
      },
    })
    createdUsers.push(user)
  }

  console.log('✅ Created test users')

  // Create pantry items with more variety and better categorization
  const pantryItemsData = [
    // Proteins
    { itemName: 'Organic Eggs', category: 'Protein', notes: 'Free-range, omega-3 enriched' },
    { itemName: 'Chicken Breast', category: 'Protein', notes: 'Boneless, skinless, antibiotic-free' },
    { itemName: 'Wild-Caught Salmon', category: 'Protein', notes: 'Rich in omega-3 fatty acids' },
    { itemName: 'Greek Yogurt', category: 'Protein', notes: 'Plain, 2% fat, high protein' },
    { itemName: 'Extra Firm Tofu', category: 'Protein', notes: 'Organic, non-GMO' },
    { itemName: 'Black Beans', category: 'Protein', notes: 'Dried, need to soak overnight' },
    
    // Dairy
    { itemName: 'Organic Milk', category: 'Dairy', notes: 'Whole milk, grass-fed' },
    { itemName: 'Sharp Cheddar', category: 'Dairy', notes: 'Aged 2 years, from local farm' },
    { itemName: 'Cottage Cheese', category: 'Dairy', notes: 'Low-fat, high protein' },
    
    // Grains
    { itemName: 'Quinoa', category: 'Grain', notes: 'Tri-color mix, complete protein' },
    { itemName: 'Brown Rice', category: 'Grain', notes: 'Long grain, whole grain' },
    { itemName: 'Sourdough Bread', category: 'Grain', notes: 'Whole wheat, locally made' },
    { itemName: 'Steel-Cut Oats', category: 'Grain', notes: 'Irish oats, high fiber' },
    
    // Vegetables
    { itemName: 'Fresh Spinach', category: 'Vegetable', notes: 'Baby spinach, organic' },
    { itemName: 'Bell Peppers', category: 'Vegetable', notes: 'Red, yellow, and orange mix' },
    { itemName: 'Sweet Potatoes', category: 'Vegetable', notes: 'Medium size, great for roasting' },
    { itemName: 'Broccoli', category: 'Vegetable', notes: 'Fresh crowns, high in vitamin C' },
    { itemName: 'Carrots', category: 'Vegetable', notes: 'Baby carrots, ready to eat' },
    
    // Others
    { itemName: 'Honeycrisp Apples', category: 'Other', notes: 'Crisp and sweet, great for snacking' },
    { itemName: 'Bananas', category: 'Other', notes: 'Perfect ripeness for smoothies' },
    { itemName: 'Blueberries', category: 'Other', notes: 'Fresh, high in antioxidants' },
    { itemName: 'Avocados', category: 'Other', notes: 'Ripe, great for healthy fats' },
  ]

  // Distribute pantry items among users
  for (let i = 0; i < pantryItemsData.length; i++) {
    const user = createdUsers[i % createdUsers.length]
    await prisma.pantryItem.create({
      data: {
        ...pantryItemsData[i],
        userId: user.id,
      },
    })
  }

  console.log('✅ Created pantry items')

  // Create more realistic conversations
  const conversationsData = [
    {
      userId: createdUsers[0].id, // John Doe - Vegetarian, Intermediate
      title: 'Vegetarian Muscle Building',
      lastMessage: 'What vegetarian proteins should I focus on?',
      messages: [
        { 
          role: 'user', 
          content: 'I\'m trying to build muscle on a vegetarian diet. What should I focus on?',
          createdAt: new Date('2024-01-15T14:30:00Z')
        },
        { 
          role: 'assistant', 
          content: 'Great question! For vegetarian muscle building, focus on complete proteins like quinoa, Greek yogurt, eggs, and combine incomplete proteins. I see you have tofu, black beans, and Greek yogurt in your pantry - perfect choices! Aim for 1.6-2.2g protein per kg of body weight. Would you like a specific meal plan using your current pantry items?',
          createdAt: new Date('2024-01-15T14:32:00Z')
        },
        { 
          role: 'user', 
          content: 'Yes, that would be helpful! Especially for post-workout meals.',
          createdAt: new Date('2024-01-15T14:35:00Z')
        },
        { 
          role: 'assistant', 
          content: 'Perfect! Here\'s a post-workout meal using your pantry:\n\n**Protein-Packed Quinoa Bowl**\n- 1 cup cooked quinoa (8g protein)\n- 3oz extra firm tofu, cubed and pan-fried (9g protein)\n- 2 scrambled eggs (12g protein)\n- 1/2 cup black beans (7g protein)\n- Fresh spinach and bell peppers\n\nTotal: ~36g protein! The combination provides all essential amino acids for muscle recovery.',
          createdAt: new Date('2024-01-15T14:37:00Z')
        }
      ]
    },
    {
      userId: createdUsers[1].id, // Sarah Smith - Marathon training, Advanced
      title: 'Marathon Training Nutrition',
      lastMessage: 'How should I fuel during long runs?',
      messages: [
        { 
          role: 'user', 
          content: 'I\'m training for my first marathon. How should I approach nutrition for long runs?',
          createdAt: new Date('2024-01-10T08:15:00Z')
        },
        { 
          role: 'assistant', 
          content: 'Marathon nutrition is crucial! For runs over 90 minutes, you\'ll need to fuel during the run. Pre-run: focus on easily digestible carbs 2-3 hours before. I see you have oats and bananas - perfect! A bowl of steel-cut oats with banana and a touch of honey 2-3 hours before your long run would be ideal.',
          createdAt: new Date('2024-01-10T08:18:00Z')
        },
        { 
          role: 'user', 
          content: 'What about during the run? And post-run recovery?',
          createdAt: new Date('2024-01-10T08:20:00Z')
        },
        { 
          role: 'assistant', 
          content: 'During runs over 90 min: 30-60g carbs per hour (sports drinks, gels, or dates). Post-run within 30 min: 3:1 or 4:1 carb-to-protein ratio. Try chocolate milk, or make a recovery smoothie with your bananas, Greek yogurt, and milk - perfect combo for glycogen replenishment and muscle repair!',
          createdAt: new Date('2024-01-10T08:23:00Z')
        }
      ]
    },
    {
      userId: createdUsers[2].id, // Mike Wilson - Beginner
      title: 'Getting Started with Healthy Eating',
      lastMessage: 'What should I cook first?',
      messages: [
        { 
          role: 'user', 
          content: 'I\'m new to healthy cooking. Where should I start with the ingredients I have?',
          createdAt: new Date('2024-01-12T19:30:00Z')
        },
        { 
          role: 'assistant', 
          content: 'Welcome to your healthy eating journey! Let\'s start simple with ingredients you have. I recommend beginning with basic techniques:\n\n1. **Roasted vegetables** - sweet potatoes, broccoli, and carrots with olive oil\n2. **Simple proteins** - baked chicken breast or scrambled eggs\n3. **Easy grains** - brown rice or quinoa\n\nThese basics will give you confidence and are hard to mess up!',
          createdAt: new Date('2024-01-12T19:33:00Z')
        },
        { 
          role: 'user', 
          content: 'That sounds doable! What should I cook first?',
          createdAt: new Date('2024-01-12T19:35:00Z')
        }
      ]
    },
    {
      userId: createdUsers[0].id, // John Doe
      title: 'Low Carb Vegetarian Ideas',
      lastMessage: 'Need dinner inspiration',
      messages: [
        { 
          role: 'user', 
          content: 'I need some low-carb vegetarian dinner ideas using what I have.',
          createdAt: new Date('2024-01-08T17:45:00Z')
        },
        { 
          role: 'assistant', 
          content: 'Perfect! Low-carb vegetarian meals using your pantry:\n\n**Veggie-Loaded Frittata**\n- 6 eggs whisked\n- Spinach, bell peppers, broccoli\n- Top with sharp cheddar\n- Bake at 375°F for 15-20 min\n\n**Tofu Stir-Fry**\n- Cubed extra firm tofu\n- Bell peppers, broccoli, spinach\n- Season with herbs/spices\n- Serve over cauliflower rice (or small portion quinoa)\n\nBoth are under 15g net carbs!',
          createdAt: new Date('2024-01-08T17:48:00Z')
        }
      ]
    }
  ]

  for (const convData of conversationsData) {
    const conversation = await prisma.conversation.create({
      data: {
        title: convData.title,
        lastMessage: convData.lastMessage,
        userId: convData.userId,
      },
    })

    for (const msg of convData.messages) {
      await prisma.conversationMessage.create({
        data: {
          role: msg.role,
          content: msg.content,
          userId: convData.userId,
          conversationId: conversation.id,
          createdAt: msg.createdAt,
        },
      })
    }
  }

  console.log('✅ Created conversations and messages')
  console.log('🎉 Database seeded successfully!')
  console.log(`📊 Created ${createdUsers.length} users, ${pantryItemsData.length} pantry items, and ${conversationsData.length} conversations`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
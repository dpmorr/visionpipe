import { OpenAPIV3 } from 'openapi-types';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'wastetraq API',
    version: '1.0.0',
    description: 'API documentation for wastetraq - Intelligent Waste Management Platform',
    contact: {
      name: 'API Support',
      email: 'support@wastetraq.com'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'Development server'
    }
  ],
  tags: [
    { name: 'Waste Management', description: 'Endpoints for managing waste items and tracking' },
    { name: 'Compliance', description: 'AI-powered compliance checking against Australian regulations' },
    { name: 'Analytics', description: 'Sustainability metrics and performance analysis' },
    { name: 'Training', description: 'Interactive waste management training scenarios' },
    { name: 'Vendors', description: 'Vendor marketplace and management' },
    { name: 'Reports', description: 'Report generation and management' },
    { name: 'Pickup Schedule', description: 'Pickup schedule management' },
    { name: 'Invoicing', description: 'Invoice management' },
    { name: 'Process Maker', description: 'Business process management'},
    { 
      name: 'Circular Initiatives', 
      description: 'Project management for circular economy initiatives' 
    }
  ],
  paths: {
    '/waste-items': {
      post: {
        tags: ['Waste Management'],
        summary: 'Create a new waste item',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                  location: { type: 'string' },
                  dateLogged: { type: 'string', format: 'date-time' }
                },
                required: ['type', 'quantity', 'unit']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Waste item created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/WasteItem'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Waste Management'],
        summary: 'Get waste items for a user',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'List of waste items',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/WasteItem'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/compliance/check': {
      post: {
        tags: ['Compliance'],
        summary: 'Perform AI-powered compliance check',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  wasteType: { type: 'string' },
                  wasteDescription: { type: 'string' },
                  location: { type: 'string' },
                  quantity: { type: 'string' },
                  storageMethod: { type: 'string' },
                  containment: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  licenses: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  procedures: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['wasteType', 'location', 'quantity']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Compliance check results',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ComplianceResult'
                }
              }
            }
          }
        }
      }
    },
    '/metrics/sustainability': {
      get: {
        tags: ['Analytics'],
        summary: 'Get sustainability metrics',
        responses: {
          '200': {
            description: 'Sustainability metrics and KPIs',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SustainabilityMetrics'
                }
              }
            }
          }
        }
      }
    },
    '/training/scenarios': {
      get: {
        tags: ['Training'],
        summary: 'Get training scenarios',
        responses: {
          '200': {
            description: 'List of training scenarios',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/TrainingScenario'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/vendors': {
      get: {
        tags: ['Vendors'],
        summary: 'Search vendors',
        parameters: [
          {
            name: 'wasteTypes',
            in: 'query',
            schema: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          {
            name: 'location',
            in: 'query',
            schema: { type: 'string' }
          },
          {
            name: 'minRating',
            in: 'query',
            schema: { type: 'number' }
          },
          {
            name: 'certifications',
            in: 'query',
            schema: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of vendors matching criteria',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Vendor'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/reports/generate': {
      post: {
        tags: ['Reports'],
        summary: 'Generate sustainability report',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sections: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: ['waste', 'recycling', 'vendors', 'costs']
                    }
                  },
                  dateRange: {
                    type: 'object',
                    properties: {
                      start: { type: 'string', format: 'date' },
                      end: { type: 'string', format: 'date' }
                    }
                  },
                  format: {
                    type: 'string',
                    enum: ['pdf', 'excel']
                  }
                },
                required: ['sections', 'format']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Generated report file',
            content: {
              'application/pdf': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              },
              'application/vnd.ms-excel': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      }
    },
    '/schedules': {
      post: {
        tags: ['Pickup Schedule'],
        summary: 'Create a new pickup schedule',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  wastePointId: { type: 'integer' },
                  wasteTypes: { 
                    type: 'array',
                    items: { type: 'string' }
                  },
                  date: { type: 'string', format: 'date' },
                  status: { 
                    type: 'string',
                    enum: ['pending', 'scheduled']
                  }
                },
                required: ['wastePointId', 'wasteTypes', 'date']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Pickup schedule created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PickupSchedule'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Pickup Schedule'],
        summary: 'Get pickup schedules',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['pending', 'completed', 'cancelled']
            }
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' }
          }
        ],
        responses: {
          '200': {
            description: 'List of pickup schedules',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/PickupSchedule'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/invoices': {
      post: {
        tags: ['Invoicing'],
        summary: 'Create a new invoice',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  vendorId: { type: 'integer' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        description: { type: 'string' },
                        quantity: { type: 'number' },
                        unitPrice: { type: 'number' }
                      }
                    }
                  },
                  issueDate: { type: 'string', format: 'date' },
                  dueDate: { type: 'string', format: 'date' },
                  totalAmount: { type: 'number' },
                  notes: { type: 'string' }
                },
                required: ['vendorId', 'items', 'issueDate', 'dueDate', 'totalAmount']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Invoice created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Invoice'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Invoicing'],
        summary: 'Get invoices',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['pending', 'paid', 'overdue']
            }
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' }
          }
        ],
        responses: {
          '200': {
            description: 'List of invoices',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Invoice'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/processes': {
      post: {
        tags: ['Process Maker'],
        summary: 'Create a new business process',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        type: {
                          type: 'string',
                          enum: ['approval', 'task', 'notification']
                        }
                      }
                    }
                  },
                  assignees: {
                    type: 'array',
                    items: { type: 'integer' }
                  },
                  dueDate: { type: 'string', format: 'date' }
                },
                required: ['name', 'steps', 'assignees']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Process created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Process'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Process Maker'],
        summary: 'Get processes',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['active', 'completed', 'cancelled']
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of processes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Process'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/processes/{id}/step': {
      patch: {
        tags: ['Process Maker'],
        summary: 'Update process step',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    enum: ['next', 'previous']
                  }
                },
                required: ['action']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Process step updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currentStep: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/initiatives': {
      post: {
        tags: ['Circular Initiatives'],
        summary: 'Create a new circular initiative',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  estimatedImpact: {
                    type: 'object',
                    properties: {
                      wasteReduction: { type: 'number' },
                      costSavings: { type: 'number' },
                      carbonReduction: { type: 'number' }
                    }
                  },
                  startDate: { type: 'string', format: 'date-time' },
                  targetDate: { type: 'string', format: 'date-time' },
                  budget: { type: 'number' },
                  sourceType: { 
                    type: 'string',
                    enum: ['analytics', 'recycling', 'manual']
                  },
                  sourceReference: { type: 'string' }
                },
                required: ['title', 'description']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Initiative created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Initiative'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Circular Initiatives'],
        summary: 'Get circular initiatives',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['planning', 'active', 'completed', 'cancelled']
            }
          },
          {
            name: 'sourceType',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['analytics', 'recycling', 'manual']
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of initiatives',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Initiative'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/initiatives/from-suggestion': {
      post: {
        tags: ['Circular Initiatives'],
        summary: 'Create initiative from analytics or recycling suggestion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sourceType: {
                    type: 'string',
                    enum: ['analytics', 'recycling']
                  },
                  sourceReference: { type: 'string' },
                  suggestionData: { type: 'object' }
                },
                required: ['sourceType', 'sourceReference', 'suggestionData']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Initiative created from suggestion',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Initiative'
                }
              }
            }
          }
        }
      }
    },
    '/initiatives/{id}/tasks': {
      post: {
        tags: ['Circular Initiatives'],
        summary: 'Create a new task for an initiative',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaskInput'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Task'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      WasteItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          type: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          location: { type: 'string' },
          dateLogged: { type: 'string', format: 'date-time' },
          userId: { type: 'integer' }
        }
      },
      ComplianceResult: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['compliant', 'non-compliant', 'warning']
                },
                regulation: { type: 'string' },
                details: { type: 'string' },
                recommendations: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      SustainabilityMetrics: {
        type: 'object',
        properties: {
          wasteReduction: { type: 'number' },
          recyclingRate: { type: 'number' },
          carbonFootprint: { type: 'number' },
          costSavings: { type: 'number' },
          vendorPerformance: { type: 'number' },
          goalProgress: { type: 'number' }
        }
      },
      TrainingScenario: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                impact: { type: 'number' },
                feedback: { type: 'string' }
              }
            }
          },
          correctOption: { type: 'integer' },
          explanation: { type: 'string' },
          category: {
            type: 'string',
            enum: ['waste', 'recycling', 'circular', 'compliance']
          },
          animation: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['sort', 'process', 'cycle']
              },
              elements: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      },
      Vendor: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          services: {
            type: 'array',
            items: { type: 'string' }
          },
          rating: { type: 'number' },
          serviceAreas: {
            type: 'array',
            items: { type: 'string' }
          },
          certificationsAndCompliance: {
            type: 'array',
            items: { type: 'string' }
          },
          onTimeRate: { type: 'number' },
          recyclingEfficiency: { type: 'number' },
          customerSatisfaction: { type: 'number' }
        }
      },
      PickupSchedule: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          wasteTypes: { 
            type: 'array',
            items: { type: 'string' }
          },
          wastePointId: { type: 'integer' },
          status: {
            type: 'string',
            enum: ['pending', 'scheduled']
          },
          organizationId: { type: 'integer' },
          isRecurring: { type: 'boolean' },
          recurringInterval: { type: 'integer' },
          recurringUnit: { type: 'string' },
          recurringGroupId: { type: 'string' }
        }
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          vendorId: { type: 'integer' },
          invoiceNumber: { type: 'string' },
          issueDate: { type: 'string', format: 'date' },
          dueDate: { type: 'string', format: 'date' },
          totalAmount: { type: 'number' },
          status: {
            type: 'string',
            enum: ['pending', 'paid', 'overdue']
          },
          notes: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number' },
                totalPrice: { type: 'number' }
              }
            }
          }
        }
      },
      Process: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          name: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['approval', 'task', 'notification']
                }
              }
            }
          },
          assignees: {
            type: 'array',
            items: { type: 'integer' }
          },
          currentStep: { type: 'integer' },
          status: {
            type: 'string',
            enum: ['active', 'completed', 'cancelled']
          },
          dueDate: { type: 'string', format: 'date' }
        }
      },
      Initiative: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: {
            type: 'string',
            enum: ['planning', 'active', 'completed', 'cancelled']
          },
          estimatedImpact: {
            type: 'object',
            properties: {
              wasteReduction: { type: 'number' },
              costSavings: { type: 'number' },
              carbonReduction: { type: 'number' }
            }
          },
          startDate: { type: 'string', format: 'date-time' },
          targetDate: { type: 'string', format: 'date-time' },
          budget: { type: 'number' },
          sourceType: {
            type: 'string',
            enum: ['analytics', 'recycling', 'manual']
          },
          sourceReference: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      TaskInput: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          assignedTo: { type: 'integer' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high']
          },
          startDate: { type: 'string', format: 'date-time' },
          dueDate: { type: 'string', format: 'date-time' },
          dependencies: {
            type: 'array',
            items: { type: 'integer' }
          }
        },
        required: ['title']
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          initiativeId: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          assignedTo: { type: 'integer' },
          status: {
            type: 'string',
            enum: ['todo', 'in_progress', 'completed', 'blocked']
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high']
          },
          startDate: { type: 'string', format: 'date-time' },
          dueDate: { type: 'string', format: 'date-time' },
          completionDate: { type: 'string', format: 'date-time' },
          dependencies: {
            type: 'array',
            items: { type: 'integer' }
          },
          progress: { type: 'integer' },
          notes: { type: 'string' }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wastetraq API',
      version: '1.0.0',
      description: 'API documentation for the Wastetraq platform',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Change to your API base URL
      },
    ],
  },
  apis: [
    './server/routes/**/*.ts', // Path to your route files for JSDoc comments
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
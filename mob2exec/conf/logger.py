server_log_config = { 'version' : 1 ,
              'disable_existing_loggers': True,
               'formatters': {
                        'default':{ 'format': '%(name)-10s : %(levelname)-8s : %(filename)-10s: L %(lineno)d : %(asctime)s : %(message)s' ,
                                   'datefmt': '%a, %d %b %Y %H:%M:%S'   
                                   } ,
                        'access': { 'format': '%(asctime)s  %(message)s' ,
                                    'datefmt': '%a, %d %b %Y %H:%M:%S'
                                },
                        'building': {'format': '%(message)s' },          
                        } ,
               'handlers': {
                            'error':{
                                       'class' : 'logging.handlers.WatchedFileHandler',
                                       'formatter': 'default' ,
                                       'filename': '/tmp/mob2/mob2_error.log',
                                       'mode': 'a',
                                       'level'   : 'NOTSET',
                                       },
                            'access':{ 'class' : 'logging.handlers.WatchedFileHandler',
                                       'formatter': 'access' ,
                                       'filename': '/tmp/mob2/mob2_access.log',
                                       'mode': 'a',
                                       'level'   : 'NOTSET',
                                       },
                            'building':{'class' : 'logging.handlers.WatchedFileHandler',
                                       'formatter': 'building' ,
                                       'filename': '/tmp/mob2/mob2_build.log',
                                       'mode': 'a',
                                       'level'   : 'NOTSET',
                                       },
                            'account':{'class' : 'logging.handlers.WatchedFileHandler',
                                       'formatter': 'access' ,
                                       'filename': '/tmp/mob2/mob2_account.log',
                                       'mode': 'a',
                                       'level'   : 'NOTSET',
                                       },
                            'email':{
                                     'class': 'logging.handlers.SMTPHandler' ,
                                     'mailhost': 'localhost' ,
                                     'fromaddr': ['bneron+sender1@pasteur.fr', 'bneron+sender2@pasteur.fr'],
                                     'toaddrs': ['bneron+admin1@pasteur.fr' , 'bneron+admin2@pasteur.fr'],
                                     'subject': 'Mobyle test Logger', 
                                      'level'   : 'CRITICAL',
                                     },
                            }, 
               
               'loggers': { '':{
                                    'handlers': [ 'error', 'email'] ,
                                    'level': 'NOTSET'
                                    },
                            'access':{'handlers': [ 'access'] ,
                                      'propagate': False,
                                      },
                            'building':{'handlers': [ 'building'],
                                        'propagate': False,
                                         },
                            'account' :{'handlers': [ 'account'],
                                        'propagate': False, },
                            }
              }

client_log_config = { 'version' : 1 ,
                'disable_existing_loggers': True,
               'handlers': {
                            'socket':{
                                       'class' : 'logging.handlers.SocketHandler',
                                       'host' : 'localhost',
                                       'port' : 'ext://logging.handlers.DEFAULT_TCP_LOGGING_PORT',
                                       'level' : 'DEBUG',
                                       },
                            'access':{
                                       'class' : 'logging.handlers.SocketHandler',
                                       'host' : 'localhost',
                                       'port' : 'ext://logging.handlers.DEFAULT_TCP_LOGGING_PORT',
                                       'level' : 'INFO',
                                       },
                            'account':{
                                       'class' : 'logging.handlers.SocketHandler',
                                       'host' : 'localhost',
                                       'port' : 'ext://logging.handlers.DEFAULT_TCP_LOGGING_PORT',
                                       'level' : 'INFO',
                                       },
                            'building':{
                                       'class' : 'logging.handlers.SocketHandler',
                                       'host' : 'localhost',
                                       'port' : 'ext://logging.handlers.DEFAULT_TCP_LOGGING_PORT',
                                       'level' : 'INFO',
                                       },
                           
                            'email':{
                                     'class': 'logging.handlers.SMTPHandler' ,
                                     'mailhost': 'localhost' ,
                                     'fromaddr': ['bneron+sender1@pasteur.fr', 'bneron+sender2@pasteur.fr'],
                                     'toaddrs': ['bneron+admin1@pasteur.fr' , 'bneron+admin2@pasteur.fr'],
                                     'subject': 'Mobyle test Logger', 
                                      'level'   : 'CRITICAL',
                                     }
                            }, 
               
               'loggers': { '' : {
                                  'handlers': [ 'socket', 'email'] ,
                                  'level': 'NOTSET'
                                },
                      'access' : {
                                  'handlers': [ 'socket'] ,
                                  'level': 'NOTSET'
                                },
                           }
              }

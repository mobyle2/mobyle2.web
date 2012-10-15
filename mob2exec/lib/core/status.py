# -*- coding: utf-8 -*-
"""
Created on Aug 14, 2012

@author: Bertrand Néron
@contact: bneron@pasteur.fr
@organization: Institut Pasteur
@license: GPLv3
"""

import logging
_log = logging.getLogger(__name__)

from .mobyle_error import MobyleError

class Status(object):
    """reflect the different steps of a job life"""
    
    """the system is not able to determine the status of the job"""
    UNKNOWN   = 0
    """the environment of the job is building (working directory creation, building command line, ...)"""
    BUILDING  = 10
    """the job has been submitted to the execution system to be running"""
    SUBMITTED = 20
    """the job is pending in the execution system note that some system cannot pend a job (SYS)""" 
    PENDING   = 30
    """the job is running"""
    RUNNING   = 40
    """the job is completed without error"""
    FINISHED  = 50
    """un error occurred the job is stopped"""
    ERROR     = 60
    """the job was stopped by an administrator or the user"""
    KILLED    = 70
    """the job is hold by the execution system"""
    HOLD      = 80

    
    
    def __init__(self , code , message = ''):
        """
        @param code: the code of the status 
        @type code: integer 
        @param string: the code of the status representing by a string
        @type string: string
        @param message: the message associated to the status
        @type message: string
        """
        self.code = code

        if message:
            try:
                str( message )
            except Exception , err:
                #s_log.error( "Status received an non valid message: %s : %s"%( message, err ) , exc_info = True )
                raise MobyleError , err
            self.message = message
        else:
            self.message = ''
            
        
    def __eq__(self , other):
        return self.code == other.code and self.message == other.message
    
    def __ne__(self , other ):
        return self.code != other.code or self.message != other.message
    
    def __str__(self):
        if self.code == Status.UNKNOWN :
            s = "unknown"
        elif self.code == Status.BUILDING:
            s = "building"
        elif self.code == Status.SUBMITTED:
            s = "submitted"
        elif self.code == Status.PENDING:
            s = "pending"
        elif self.code == Status.RUNNING:
            s = "running"
        elif self.code == Status.FINISHED:
            s = "finished"
        elif self.code == Status.ERROR:
            s = "error"
        elif self.code == Status.KILLED:
            s= "killed"
        elif self.code == Status.HOLD:
            s = "hold"
        return s

    
    def is_ended(self):
        """
         4 : "finished"  , # the job is finished without error from Mobyle
         5 : "error"     , # the job has failed due to a MobyleError 
         6 : "killed"    , # the job has been removed by the user, or killed by the admin
        """
        return self.code in ( self.FINISHED, self.ERROR, self.KILLED )

    def is_on_error(self):
        """
         5 : "error"     , # the job has failed due to a MobyleError 
         6 : "killed"    , # the job has been removed by the user, or killed by the admin
        """
        return self.code in ( self.ERROR, self.KILLED )
        
    def is_queryable(self):
        """
        1 : "submitted" , # the job.run method has been called
        2 : "pending"   , # the job has been submitted to the batch manager but wait for a slot 
        3 : "running"   , # the job is running in the batch manager
        7 : "hold"      , # the job is hold by the batch manager
        """
        return self.code in( self.SUBMITTED, self.PENDING, self.RUNNING, self.HOLD )
    
    def is_known(self):
        return self.code != self.UNKNOWN
    
    def is_submittable(self):
        return self.code == self.BUILDING
    
    
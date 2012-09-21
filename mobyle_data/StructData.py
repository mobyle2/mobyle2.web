from MobyleError import MobyleError


class StructData:
    """
    Store and manipulate a set of data defined by the user for a specific service.
    It could be a combination of more than one king of parameters.
    """

    #: keys of all different kind of data according to EDAM ontology? Not yet!
    STRUCT_TYPES = ['IntegerDataType', 'StringDataType', 'BooleanDataType', 'FloatDataType',
                'ChoiceDataType', 'MultipleChoiceDataType', 'AbstractFileDataType', 'AbstractTextDataType',
                'TextDataType', 'ReportDataType', 'BinaryDataType', 'FilenameDataType']

    def __init__( self , dataType=None):
        """
        @param dataType: collection of inputs
        @type  dataType: array of data (ex: [('integer','IntegerDataType',2),('string','StringDataType','filename.txt'),...]
        """

        if(dataType!=None):
            for nb in range( len(dataType) ):
		if(len(dataType[nb])!=3):
		    msg = "Bad input format! Every entries must have three parameters"
		    raise MobyleError , msg 
		
	    for nb in range( len(dataType) ):	
		self.keys,self.types,self.values = zip(*dataType)
		
                if(self.types[nb] not in StructData.STRUCT_TYPES):
                    msg = "Can't find DataType : \"%s\" in Mobyle" %( self.types[nb] )
                    raise MobyleError , msg 
                else:
                    self.structure = dict(zip(self.keys,self.values))


    def __len__(self):
        return len(self.keys)



if __name__=='__main__':

        print 'Unitary testing of StructData class'
	
	#inputs definition
	data = [('nb_of_it', 'IntegerDataType', 1),('filename', 'StringDataType', 'toto')]
	print 'input structure: ', data
	d1 = StructData(data)
		
	#management of the data
	print "d1.structure['nb_of_it'] ", d1.structure['nb_of_it']
	print "d1.structure['filename'] ", d1.structure['filename']
	
	#structure definition with no input
	d2 = StructData()
	
	#example to test the raise of exception
	#data1 = [('nb_of_it', 'NoDataType', 1),('filename', 'StringDataType', 'toto')]
	#data1 = [('nb_of_it', 'IntegerDataType', 1),('filename', 'toto')]
	#d3 = StructData(data1)

	#method to access the number of inputs
	print 'number of inputs: ', len(d1) 
	
		

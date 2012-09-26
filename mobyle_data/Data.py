from MobyleError import MobyleError


class Data:

    DATA_TYPES = ['IntegerDataType', 'StringDataType', 'BooleanDataType', 'FloatDataType',
                'ChoiceDataType', 'MultipleChoiceDataType', 'AbstractFileDataType', 'AbstractTextDataType',
                'TextDataType', 'ReportDataType', 'BinaryDataType', 'FilenameDataType']
		
    def __init__( self , dataType = None, value = None):
	if(dataType in Data.DATA_TYPES):
	    self.inputType = dataType
	    self.inputValue = value 


class StructData(Data):
    
    def __init__( self, names = None, data = None):
	if(len(names)!=len(data)):
	    msg = "Bad input format! Input arrays must have the same dimensions"
	    raise MobyleError , msg 
        self.inputStruct = dict(zip(names,data))
	
    def __getitem__( self, key):
        return structure.inputStruct[key].inputType




if __name__=='__main__':

        print 'Unitary testing of Data class'
	nb_of_it = Data('IntegerDataType', 3)
	filename = Data('StringDataType', 'truc')
	
	names = ['nb_it', 'file']
	data = [nb_of_it,filename]
	
	structure = StructData(names, data)

	print "structure['nb_it'] " , structure['nb_it']
	
		

class PersistenceObject < Object
  def initialize(opts={})
    @data = {}
    ignored = %w{Digits controller url action AccountSid ToZip FromState Called FromCountry CallerCountry CalledZip Direction FromCity CalledCountry CalledState CallSid CalledState From CallerZip FromZip CallStatus ToCIty ToState To ToCountry CalleCity ApiVersion Caller CalledCity}
    opts.each do |key, value|
      unless ignored.include? key.to_s
        @data[key.to_sym] = value
      end
    end
  end

  def method_missing(method_name, *args, &block)
    if method_name[-1] == '='
      method = method_name[0...-1].to_sym
      @data[method] = args[0]
      puts "\n\nSetting #{method} to '#{args[0]}'"
    else
      @data.with_indifferent_access[method_name]
    end
  end

  def data
      @data
  end

  def to_query
    @data.to_query
  end

  def set_defaults
    self.score ||= 10
  end

  def id_number
    stringified_number self.phone[5..-1]
  end

  def stringified_choice
    stringified_number self.choice
  end

  private

  def stringified_number(num)
    num.to_s.split('').join " "
  end
end
